# Script Flow Backup

This is a backup to help rebuild the flows properly.

## Common Start (Both Flows)
1. a1 - Welcome, ask for email
2. u1 - User provides email
3. a1b - Account created (action: register-user)
4. a1c - Ask connection type (MQTT/OPC UA or Demo)
5. u2 - User chooses

## MQTT/OPC UA Flow (Original)
After u2 = "I can use MQTT" or "OPC UA":
- a2 - Ask machine name
- u3 - User provides name
- a3 - Ask split counter
- u4 - User provides split counter
- a4 - Ask training seconds
- u5 - User provides training seconds
- a5 - Ask days to maintenance
- u6 - User provides DTMN
- a6 - Show summary (action: create-profile)
- a7 - Start agent (action: start-agent)
- a9 - Show broker connection (action: show-broker)
- u8 - User says connected
- a10 - Start validation (action: start-schema-validation)
- a11 - Schema error (action: schema-error)
- u9 - User says updated
- a12 - Retry validation (action: schema-retry)
- a13 - Success, start training (action: start-training)
- a14 - Training complete, account active (action: await-training-complete)
- a15 - Machine complete, ask add user
- u10 - Yes
- ...continue with collab/ticket flow

## Demo Machine Flow (New)
After u2 = "Demo machine":
- a2-demo - Ask machine name
- u3-demo - User provides name
- a3-demo - Show config explanation card (action: show-demo-config)
- a6-demo - Create profile (action: create-profile)
- a7-demo - Start agent (action: start-agent)
- a9-demo - Explain broker connection (no actual connection needed)
- a10-demo - Explain validation process (action: auto-validate-demo)
- a13-demo - Auto training (action: start-training)
- a14-demo - Training complete (action: await-training-complete)
- a15-demo - Demo complete, show next steps
- u10-demo - Choose "Add collaborators"
- ...continue with collab/ticket flow
