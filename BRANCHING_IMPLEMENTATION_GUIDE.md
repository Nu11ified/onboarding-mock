# Branching Demo Flow Implementation Guide

## Overview
This guide explains how to implement two parallel onboarding flows that branch based on user selection:
1. **MQTT/OPC UA Flow** - Full flow for connecting real machines
2. **Demo Machine Flow** - Simplified flow using pre-configured test machine

## Implementation Approach

### Step 1: Add Flow Type State
Add a new state variable to track which flow the user is on:

```typescript
const [flowType, setFlowType] = useState<'mqtt' | 'demo' | null>(null);
```

### Step 2: Create Separate Flow Arrays

```typescript
// Common start for both flows
const COMMON_START_FLOW: ScriptStep[] = [
  { id: "a1", author: "assistant", text: "Welcome! Let's add your machine. First, I'll need your email to create your account." },
  { id: "u1", author: "user", text: "john@factory.com" },
  { id: "a1b", author: "assistant", text: "Perfect! Account created. Now, can you connect a machine to our MQTT or OPC UA public broker?", action: "register-user" },
  { id: "a1c", author: "assistant", text: "If you don't have MQTT/OPC UA available, I can set you up with a demo using our test machine instead. Just reply with 'MQTT', 'OPC UA', or 'Demo'." },
  { id: "u2", author: "user", text: "MQTT" }, // or "Demo machine"
];

// MQTT/OPC UA Flow
const MQTT_FLOW: ScriptStep[] = [
  { id: "a2", author: "assistant", text: "Great! Let's configure your device profile. What's your machine's name?" },
  { id: "u3", author: "user", text: "Injection Molding Machine" },
  { id: "a3", author: "assistant", text: "How long does one machine cycle take in seconds? (Split Counter)" },
  { id: "u4", author: "user", text: "20" },
  { id: "a4", author: "assistant", text: "How long should the training period be in seconds?" },
  { id: "u5", author: "user", text: "200" },
  { id: "a5", author: "assistant", text: "How many days are there between scheduled maintenance?" },
  { id: "u6", author: "user", text: "30" },
  { id: "a6", author: "assistant", text: "Perfect! Let me create your device profile with these settings.", action: "create-profile" },
  { id: "a7", author: "assistant", text: "Device profile created successfully. Now generating your Device ID and starting the MI Agent…", action: "start-agent" },
  { id: "a9", author: "assistant", text: "Your agent is live. Please connect to our broker:\\nmqtt://broker.micro.ai:1883\\nTopic: /ext/a1b2c3d4-e5f6\\nLet me know when you're connected.", action: "show-broker" },
  { id: "u8", author: "user", text: "Connected." },
  { id: "a10", author: "assistant", text: "Validating your connection and schema…", action: "start-schema-validation" },
  { id: "a11", author: "assistant", text: 'The payload format doesn't match. Please update to:\\n{\\n  "CycleTime": [{ "v": <number>, "t": <timestamp_ms> }],\\n  "1": [{ "v": <number>, "t": <timestamp_ms> }],\\n  "2": [{ "v": <number>, "t": <timestamp_ms> }]\\n}\\n\\nEach numeric key is a sensor channel. v = measurement, t = timestamp (ms since epoch).', action: "schema-error" },
  { id: "u9", author: "user", text: "Updated, please check." },
  { id: "a12", author: "assistant", text: "Re-validating…", action: "schema-retry" },
  { id: "a13", author: "assistant", text: "Success! Your data is streaming. Training your model now — this will take about 200 seconds.", action: "start-training" },
  { id: "a14", author: "assistant", text: "Thanks for verifying your email — your account is now active.", action: "await-training-complete", runActionBeforeMessage: true },
  { id: "a15", author: "assistant", text: "Your machine setup is complete. Health scoring and predictive maintenance are active. Would you like to add another user?" },
  { id: "u10", author: "user", text: "Yes." },
  // Continue with collaborator and ticket flow...
];

// Demo Machine Flow
const DEMO_FLOW: ScriptStep[] = [
  { id: "a2-demo", author: "assistant", text: "Excellent! I'll set you up with our demo environment. What would you like to name this demo machine?" },
  { id: "u3-demo", author: "user", text: "Injection Molding Machine" },
  { id: "a3-demo", author: "assistant", text: "Perfect! For the demo machine, I'll use pre-configured settings. Here's what we're setting up:", action: "show-demo-config" },
  { id: "a6-demo", author: "assistant", text: "Creating your device profile with these settings...", action: "create-profile" },
  { id: "a7-demo", author: "assistant", text: "Device profile created. Generating Device ID and starting the MI Agent…", action: "start-agent" },
  { id: "a9-demo", author: "assistant", text: "Normally, you would connect your machine to our public MQTT/OPC UA broker at this step. The broker validates your machine's sensor data and begins ingesting telemetry. Since this is our demo machine, it's already connected and streaming data.", action: "show-broker-explanation" },
  { id: "a10-demo", author: "assistant", text: "Now validating the data schema. We check that your sensor data matches our expected format with proper timestamps and value structures. The demo machine data is pre-validated, so this step completes automatically.", action: "auto-validate-demo" },
  { id: "a13-demo", author: "assistant", text: "Schema validated! Training your anomaly detection model now — this will take about 200 seconds.", action: "start-training" },
  { id: "a14-demo", author: "assistant", text: "Training complete! Your account is now active.", action: "await-training-complete", runActionBeforeMessage: true },
  { id: "a15-demo", author: "assistant", text: "Demo environment setup complete! You can now:\\n\\n1. Add your own machine with real sensor data\\n2. Invite team members to collaborate\\n3. Explore the dashboard and features\\n\\nWhat would you like to do next?" },
  { id: "u10-demo", author: "user", text: "Invite team members" },
  // Continue with collaborator and ticket flow...
];

// Common ending flow (collaborators, tickets, notifications)
const COMMON_END_FLOW: ScriptStep[] = [
  { id: "a16", author: "assistant", text: "Please provide name, email, and role." },
  { id: "u11", author: "user", text: "Add Jane (jane@factory.com) as Operator, and Jake (jake@factory.com) as Operator." },
  { id: "a17", author: "assistant", text: "Done. Jane and Jake have been added as Operators. Verification emails have been sent.", action: "add-operators" },
  { id: "a18", author: "assistant", text: "Would you like to create a test ticket?" },
  { id: "u12", author: "user", text: "Yes." },
  { id: "a19", author: "assistant", text: "Test ticket generated:", action: "create-ticket", runActionBeforeMessage: true },
  { id: "a20", author: "assistant", text: "Do you want to assign Ticket #T-1025 to yourself or another user?" },
  { id: "u13", author: "user", text: "Assign to Jane." },
  { id: "a21", author: "assistant", text: "Ticket #T-1025 assigned to Jane. Would you like to add context?", action: "assign-ticket" },
  { id: "u14", author: "user", text: "Add: The coolant pump needs to be checked; there may be motor casing dust buildup near Gyro X." },
  { id: "a22", author: "assistant", text: "Added context to Ticket #T-1025. Close ticket?", action: "add-ticket-context" },
  { id: "u15", author: "user", text: "Yes." },
  { id: "a23", author: "assistant", text: "Ticket #T-1025 resolved. Would you like notifications for new tickets?", action: "close-ticket" },
  { id: "u16", author: "user", text: "Yes, email only." },
  { id: "a24", author: "assistant", text: "You'll now get ticket notifications at john@factory.com. Setup complete! You can manage users, tickets, and notifications right here in chat.", action: "subscribe-notifications" },
];
```

### Step 3: Add New Actions

Add these to the `ScriptAction` type:
```typescript
type ScriptAction =
  | "register-user"
  | "create-profile"
  | "show-demo-config"        // NEW
  | "show-broker-explanation" // NEW
  | "auto-validate-demo"      // NEW
  | "start-agent"
  | "show-broker"
  // ... rest of actions
```

### Step 4: Implement New Actions in `performAction`

```typescript
case "show-demo-config":
  // This will show a card explaining the config parameters
  setPlaceholder((prev) => ({
    ...prev,
    headline: "Demo Configuration",
    message: "Using pre-configured settings for the demo machine.",
    tone: "success",
  }));
  return "continue";

case "show-broker-explanation":
  setPlaceholder((prev) => ({
    ...prev,
    headline: "Broker Connection (Demo)",
    message: "Demo machine is already connected to our broker.",
    tone: "success",
    broker: {
      url: "mqtt://broker.micro.ai:1883",
      topic: "/ext/demo-machine",
    },
  }));
  return "continue";

case "auto-validate-demo":
  setPlaceholder((prev) => ({
    ...prev,
    headline: "Schema Validated",
    message: "Demo machine data schema automatically validated.",
    tone: "success",
  }));
  return "continue";
```

### Step 5: Create Demo Config Card Component

```typescript
function DemoConfigCard() {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-slate-600">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
        Demo Configuration
      </p>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="font-semibold text-slate-700">Split Cycle (20 seconds)</dt>
          <dd className="mt-1 text-slate-600">
            The time window our algorithm uses to detect variability in one machine cycle.
            This helps identify anomalies within operational patterns.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">Training Duration (200 seconds)</dt>
          <dd className="mt-1 text-slate-600">
            How long the MI Agent trains before entering inference mode.
            During training, the agent learns your machine's normal behavior baseline.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-700">Days to Maintenance (30 days)</dt>
          <dd className="mt-1 text-slate-600">
            Used in our predictive maintenance algorithm to forecast when service is needed
            based on historical patterns and current operational data.
          </dd>
        </div>
      </dl>
    </div>
  );
}
```

### Step 6: Dynamic Flow Selection

```typescript
// Build the complete flow based on user selection
const getActiveFlow = useCallback((): ScriptStep[] => {
  if (!flowType) {
    // Return up to the decision point
    return COMMON_START_FLOW;
  }
  
  if (flowType === 'mqtt') {
    return [...COMMON_START_FLOW, ...MQTT_FLOW, ...COMMON_END_FLOW];
  }
  
  if (flowType === 'demo') {
    return [...COMMON_START_FLOW, ...DEMO_FLOW, ...COMMON_END_FLOW];
  }
  
  return COMMON_START_FLOW;
}, [flowType]);

// Use this in advanceScript
const activeFlow = getActiveFlow();
```

### Step 7: Update applyUserInput

```typescript
case "u2": {
  const response = text.trim().toLowerCase();
  let connectionType = "MQTT";
  let selectedFlow: 'mqtt' | 'demo' = 'mqtt';
  
  if (response.includes("demo")) {
    connectionType = "Demo";
    selectedFlow = 'demo';
  } else if (response.includes("opc") || response.includes("ua")) {
    connectionType = "OPC UA";
    selectedFlow = 'mqtt'; // Use MQTT flow for OPC UA too
  } else if (response.includes("mqtt")) {
    connectionType = "MQTT";
    selectedFlow = 'mqtt';
  }
  
  setFlowType(selectedFlow);
  return { ...data, connectionType };
}
```

### Step 8: Update buildAttachment

```typescript
if (stepId === "a3-demo") {
  return <DemoConfigCard />;
}
```

## Benefits of This Approach

1. ✅ Both flows are completely separate and maintainable
2. ✅ Common sections (start and end) are shared to avoid duplication
3. ✅ Easy to add new flows in the future
4. ✅ Clean branching logic based on user selection
5. ✅ Each flow can have unique steps and actions

## Testing

1. Test MQTT path: Reply "I can use MQTT" at connection type question
2. Test Demo path: Reply "Demo machine" at connection type question
3. Verify both paths lead to the same collaborator/ticket flow at the end
4. Check that config card shows up in demo path
5. Verify broker explanation shows in demo path instead of real connection

This implementation maintains both complete flows while allowing clean branching!
