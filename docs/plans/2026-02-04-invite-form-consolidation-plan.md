# Invite Form Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move user info collection (first name, last name, email) from the onboarding chat into the landing page invite modal, add validation, add a "request code" step with smooth slide transitions, and update the onboarding flow to start at OTP.

**Architecture:** The invite modal in `src/app/page.tsx` gets rebuilt with two sliding steps: an invite form (name + email + invite code) and a request-code form (phone number). On submit, user data is stored in localStorage. The flow state machine in `src/lib/flow/definitions/onboarding.ts` changes its initial state from `user-info` to `otp`, reading user data from localStorage. The `user-info` state is removed.

**Tech Stack:** Next.js, React, Tailwind CSS, localStorage for data passing

---

### Task 1: Add slide transition CSS keyframes

**Files:**
- Modify: `src/app/globals.css:193-206` (after existing fade-in-up keyframes)

**Step 1: Add CSS keyframes for slide transitions**

Add these keyframes and utility classes after the existing `animate-fade-in-up` block (after line 206):

```css
@keyframes slide-out-left {
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-30px); }
}
@keyframes slide-in-right {
  0% { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes slide-out-right {
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(30px); }
}
@keyframes slide-in-left {
  0% { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}

.animate-slide-out-left {
  animation: slide-out-left 0.25s ease forwards;
}
.animate-slide-in-right {
  animation: slide-in-right 0.25s ease forwards;
}
.animate-slide-out-right {
  animation: slide-out-right 0.25s ease forwards;
}
.animate-slide-in-left {
  animation: slide-in-left 0.25s ease forwards;
}
```

**Step 2: Verify the dev server compiles without errors**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npm run dev` (check for compilation errors in terminal)

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add slide transition CSS keyframes for invite modal steps"
```

---

### Task 2: Rebuild the invite modal in the landing page

**Files:**
- Modify: `src/app/page.tsx:1-163` (imports, state, handlers)
- Modify: `src/app/page.tsx:236-516` (the invite popup portal)

This is the largest task. Replace the entire invite popup section with the new two-step form.

**Step 1: Update state variables and imports**

In `src/app/page.tsx`, update the state section (lines 129-133). Remove the old `inviteStep` type and add new state:

Replace:
```typescript
const [showInvitePopup, setShowInvitePopup] = useState(false);
const [inviteCode, setInviteCode] = useState("");
const [termsAccepted, setTermsAccepted] = useState(false);
const [inviteStep, setInviteStep] = useState<"enter" | "phone" | "verify">("enter");
const [phoneNumber, setPhoneNumber] = useState("");
```

With:
```typescript
const [showInvitePopup, setShowInvitePopup] = useState(false);
const [inviteStep, setInviteStep] = useState<"form" | "request">("form");
const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [inviteCode, setInviteCode] = useState("");
const [termsAccepted, setTermsAccepted] = useState(false);
const [phoneNumber, setPhoneNumber] = useState("");
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
const [codeSentBanner, setCodeSentBanner] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
```

Add `Loader2, Mail, User` to the lucide-react import (alongside existing imports like `Key`, `X`, `Phone`, `ArrowLeft`).

Also import `isValidEmail`:
```typescript
import { isValidEmail } from '@/lib/onboarding/utils';
```

**Step 2: Update the invite submit handler**

Replace `handleInviteSubmit` (lines 158-163) with:

```typescript
const validateInviteForm = (): boolean => {
  const errors: Record<string, string> = {};
  if (!firstName.trim()) errors.firstName = "First name is required";
  if (!lastName.trim()) errors.lastName = "Last name is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!isValidEmail(email)) errors.email = "Please enter a valid email";
  if (!inviteCode.trim()) errors.inviteCode = "Invite code is required";
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleInviteSubmit = () => {
  if (!validateInviteForm() || !termsAccepted) return;
  setIsSubmitting(true);
  // Store user info in localStorage for the onboarding flow to read
  localStorage.setItem("invite_user_info", JSON.stringify({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    inviteCode: inviteCode.trim(),
  }));
  setShowInvitePopup(false);
  setIsRouting(true);
  router.push("/onboarding");
};

const handleGoToRequest = () => {
  setSlideDirection("forward");
  setInviteStep("request");
};

const handleBackToForm = () => {
  setSlideDirection("back");
  setInviteStep("form");
};

const handleSendCode = () => {
  if (!phoneNumber.trim()) return;
  // Mock: just go back to form with success banner
  setSlideDirection("back");
  setInviteStep("form");
  setCodeSentBanner(true);
  setTimeout(() => setCodeSentBanner(false), 5000);
};

const clearField = (field: string) => {
  if (formErrors[field]) {
    setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }
};
```

**Step 3: Replace the invite popup portal JSX**

Replace everything inside the `{showInvitePopup && createPortal(...)` block (lines 236-516) with the new two-step modal. The modal shell stays the same (backdrop + rounded container + close button). The inner content switches between "form" and "request" steps using the slide animation classes.

The "form" step contains:
- Success banner (conditional, green, with checkmark)
- Icon (sparkles or key)
- Header: "Get Started"
- Subheader: "Enter your details and invite code to begin"
- First name + Last name (grid cols-2)
- Email
- Invite code
- Terms checkbox
- Continue button (disabled until all valid + terms)
- "Don't have a code? Request one" link

The "request" step contains:
- Back arrow top-left
- Phone icon
- Header: "Request an Invite Code"
- Subheader: "Enter your phone number and we'll text you a code"
- Phone number input
- Send Code button

Each step div gets the appropriate animation class based on `slideDirection`.

**Step 4: Verify the landing page renders correctly**

Run the dev server, navigate to `/`, select a scenario, click send, verify the modal opens with all fields.

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rebuild invite modal with user info fields, validation, and slide transitions"
```

---

### Task 3: Update the onboarding flow state machine to start at OTP

**Files:**
- Modify: `src/lib/flow/definitions/onboarding.ts:4-15` (change initial state, update otp message)

**Step 1: Change initial state and update OTP message**

In `src/lib/flow/definitions/onboarding.ts`:

1. Change `initial: 'user-info'` to `initial: 'otp'`
2. Update the `otp` state message to read the user's email from localStorage context:

```typescript
otp: {
  id: 'otp',
  message: (ctx: any) => {
    const email = ctx.email || 'your email';
    return `Welcome, ${ctx.firstName || ''}! 👋
We've sent a 6-digit verification code to ${email}.
Please check your inbox and enter the code below to verify your email and continue with the setup.

Didn't get the code? You can resend it after a few seconds, or check your spam/junk folder.`;
  },
  widget: { type: 'otp-form', data: { allowResend: true } },
  waitForUserInput: true,
  on: {
    VERIFY: { target: 'mode-select', action: 'validate-otp' },
  },
},
```

3. Remove or comment out the `user-info` state entirely since it's no longer the entry point.

**Step 2: Verify the flow starts at OTP**

Navigate through the full flow: landing page → invite modal → submit → should land on onboarding page with OTP step as first message.

**Step 3: Commit**

```bash
git add src/lib/flow/definitions/onboarding.ts
git commit -m "feat: change onboarding flow to start at OTP, remove user-info state"
```

---

### Task 4: Read invite data from localStorage on onboarding page mount

**Files:**
- Modify: `src/lib/flow/actions.ts` or `src/hooks/useFlow.ts` — wherever the machine context is initialized

The state machine needs the user info (firstName, lastName, email) in its context so the OTP message can reference the email and subsequent steps have the data.

**Step 1: Find where the machine is initialized**

Look at `src/hooks/useFlow.ts:22`. The `StateMachine` constructor takes an initial context `{}`. We need to populate this with localStorage data.

**Step 2: Seed machine context from localStorage**

In `src/hooks/useFlow.ts`, update the machine initialization to read from localStorage:

Replace:
```typescript
const machine = useMemo(() => new StateMachine(ONBOARDING_FLOW, actions, {}, persist), [persist]);
```

With:
```typescript
const initialContext = useMemo(() => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('invite_user_info');
    if (saved) {
      const { firstName, lastName, email, inviteCode } = JSON.parse(saved);
      return { firstName, lastName, email, inviteCode };
    }
  } catch {}
  return {};
}, []);
const machine = useMemo(() => new StateMachine(ONBOARDING_FLOW, actions, initialContext, persist), [initialContext, persist]);
```

**Step 3: Verify context flows through**

After submitting the invite modal, the onboarding page should show "Welcome, [firstName]!" and reference the correct email in the OTP step.

**Step 4: Commit**

```bash
git add src/hooks/useFlow.ts
git commit -m "feat: seed onboarding machine context from invite localStorage data"
```

---

### Task 5: Update the StatusPanel phase mapping

**Files:**
- Modify: `src/app/onboarding/page.tsx:61-95` (mapStateToPhase function)

**Step 1: Update phase mapping**

Since the flow no longer starts at `user-info`, update `mapStateToPhase` so the default/initial phase is `"otp"` instead of `"welcome"`:

```typescript
function mapStateToPhase(
  stateId: string | undefined,
  mode: "demo" | "live" | undefined,
): OnboardingPhase {
  if (!stateId) return "otp";
  // ... rest unchanged ...
}
```

Remove or keep the `user-info` mapping — it won't be hit anymore but harmless to leave.

**Step 2: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: update status panel default phase to otp"
```

---

### Task 6: Update the old NON_LOGIN_FLOW in flows.ts

**Files:**
- Modify: `src/lib/onboarding/flows.ts:95-115` (remove user-info steps)

**Step 1: Update NON_LOGIN_FLOW**

The `NON_LOGIN_FLOW` array in `flows.ts` is the legacy flow definition (used by `FlowManager`). Update it to start at `otp-prompt` instead of `user-info-prompt`:

- Remove the `user-info-prompt` step (lines 97-106)
- Remove the `user-info-processing` step (lines 109-115)
- Update the `otp-prompt` message to reference context email (same pattern as Task 3)

**Step 2: Commit**

```bash
git add src/lib/onboarding/flows.ts
git commit -m "feat: remove user-info steps from legacy NON_LOGIN_FLOW"
```

---

### Task 7: Clean up the reset function

**Files:**
- Modify: `src/hooks/useFlow.ts:343-385` (reset function)

**Step 1: Add invite_user_info to localStorage cleanup**

In the `itemsToRemove` array inside the `reset` callback, add `'invite_user_info'`:

```typescript
const itemsToRemove = [
  'onboarding_chat_messages',
  'dashboard_chat_messages',
  'onboarding_state',
  'onboarding_complete',
  'onboarding_machine',
  'training_complete',
  'pending_user_info',
  'pending_reset_email',
  'demo_password_set',
  'user_session',
  'invite_user_info',  // <-- add this
];
```

**Step 2: Commit**

```bash
git add src/hooks/useFlow.ts
git commit -m "feat: clean up invite_user_info on flow reset"
```

---

### Task 8: End-to-end verification

**Step 1: Clear localStorage and test full flow**

1. Open browser DevTools → Application → Clear localStorage
2. Navigate to `/`
3. Select a quick-start option → click send
4. Verify the invite modal opens with: first name, last name, email, invite code fields
5. Try submitting with empty fields → verify inline errors appear
6. Click "Don't have a code? Request one" → verify slide transition to phone step
7. Enter a phone number → click "Send Code" → verify it slides back with green banner
8. Fill all fields + accept terms → click Continue
9. Verify redirect to `/onboarding`
10. Verify OTP step appears with personalized welcome message and correct email
11. Complete OTP → verify device selection appears next
12. Continue through demo flow to completion

**Step 2: Test the reset button**

Click "Restart" in the onboarding header → verify all state is cleared including invite_user_info.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues from e2e testing"
```
