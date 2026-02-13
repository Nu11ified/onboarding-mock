# LLM Disclaimer & Ticket Hierarchy Tooltip - Design

## Feature 1: LLM Hallucination Disclaimer (Option 1.3)

**Goal:** Add a persistent disclaimer below the chat message input to warn users that LLM responses may be inaccurate.

**Text:** "LLM based systems can hallucinate! Try again if you don't get the desired response."

**Placement:** Below the message input row, always visible regardless of input state. Centered, small muted text.

**File:** `src/app/onboarding/page.tsx`

**Location in code:** After the input `<div>` (line ~764), before the status indicator block (line ~767). Add a single line of centered muted text.

**Styling:** `text-[11px] text-slate-400 text-center mt-1.5` - matches the subtle disclaimer pattern from ChatGPT/Claude.

---

## Feature 2: Ticket Hierarchy Card in Agentic Workflow Panel

**Goal:** Add a 7th card to the "What can the Agentic Workflow do?" panel explaining parent-child ticket relationships.

**File:** `src/components/widgets/AgenticWorkflowHelpPanel.tsx`

**Card details:**
- **Heading:** "Ticket Hierarchy Overview"
- **Body:** "When an event occurs on a device, a parent ticket is created to record the issue. If additional related events occur later, child tickets are created under the same parent ticket to track those follow-up issues, while the parent ticket reflects the most recent event."
- **Style:** Identical to existing 6 cards (CheckCircle2 icon, rounded-lg border border-slate-200 bg-slate-50 p-4)

**Placement:** After the last card ("Continuous Learning"), as the 7th entry.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/onboarding/page.tsx` | Add disclaimer text below input area |
| `src/components/widgets/AgenticWorkflowHelpPanel.tsx` | Add 7th card for Ticket Hierarchy Overview |
