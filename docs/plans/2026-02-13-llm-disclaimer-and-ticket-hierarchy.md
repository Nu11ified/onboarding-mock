# LLM Disclaimer & Ticket Hierarchy Card - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an LLM hallucination disclaimer below the chat input, and a Ticket Hierarchy Overview card to the Agentic Workflow help panel.

**Architecture:** Two independent UI additions - a static text disclaimer in the chat input area, and a 7th feature card in the existing help panel. Both are pure presentational changes with no state or logic modifications.

**Tech Stack:** Next.js, React, Tailwind CSS, Lucide icons

---

### Task 1: Add LLM Disclaimer Below Chat Input

**Files:**
- Modify: `src/app/onboarding/page.tsx:764` (after the input row closing tag)

**Step 1: Add disclaimer text**

In `src/app/onboarding/page.tsx`, find this exact block (around line 764-779):

```tsx
            )}

            {/* Status Indicator */}
            {!machine.state?.waitForUserInput && (
```

Insert the disclaimer between the input closing `)}` and the Status Indicator comment:

```tsx
            )}

            {/* LLM Disclaimer */}
            <p className="text-[11px] text-slate-400 text-center mt-1">
              LLM based systems can hallucinate! Try again if you don&apos;t get the desired response.
            </p>

            {/* Status Indicator */}
            {!machine.state?.waitForUserInput && (
```

**Step 2: Verify visually**

Run: `npm run dev` (or whatever dev command is configured)
Expected: A small muted disclaimer line visible below the message input area at all times.

**Step 3: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: add LLM hallucination disclaimer below chat input"
```

---

### Task 2: Add Ticket Hierarchy Overview Card to Agentic Workflow Panel

**Files:**
- Modify: `src/components/widgets/AgenticWorkflowHelpPanel.tsx:91` (after the last card, before closing `</div>`)

**Step 1: Add the 7th card**

In `src/components/widgets/AgenticWorkflowHelpPanel.tsx`, find the last card's closing tag (the "Continuous Learning" card ends at line 91):

```tsx
      </div>
    </div>
  );
}
```

Insert the new card before the closing `</div>` of the outer container:

```tsx
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Ticket Hierarchy Overview</h4>
            <p className="text-sm text-slate-600">
              When an event occurs on a device, a parent ticket is created to record the issue. If additional related events occur later, child tickets are created under the same parent ticket to track those follow-up issues, while the parent ticket reflects the most recent event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify visually**

Run: `npm run dev`
Navigate to the onboarding flow, reach the point where "What can the Agentic Workflow do?" button appears, click it, and scroll down in the right panel.
Expected: 7 cards total, with "Ticket Hierarchy Overview" as the last card, styled identically to the others.

**Step 3: Commit**

```bash
git add src/components/widgets/AgenticWorkflowHelpPanel.tsx
git commit -m "feat: add Ticket Hierarchy Overview card to agentic workflow panel"
```
