# Mobile Responsive Design — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every view (landing, login, signup, onboarding, dashboard, demo) work well on mobile (375px+) with hamburger nav, fullscreen chat, and overlay panels.

**Architecture:** Add a `useIsMobile` hook using `matchMedia` for JS-driven layout decisions. Use Tailwind `md:` breakpoint (768px) to toggle between mobile/desktop layouts. Sidebar becomes a fixed overlay on mobile, chat becomes fullscreen, right panel becomes a fullscreen overlay. No new dependencies.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Radix UI

---

### Task 1: Create `useIsMobile` hook

**Files:**
- Create: `src/hooks/useIsMobile.ts`

**Step 1: Create the hook**

```typescript
// src/hooks/useIsMobile.ts
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    onChange(mql);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIsMobile.ts
git commit -m "feat: add useIsMobile hook for responsive layout decisions"
```

---

### Task 2: Make Dashboard Sidebar mobile-friendly (hamburger overlay)

**Files:**
- Modify: `src/app/dashboard/page.tsx` — `Sidebar` component (~line 2024-2110) and `DashboardPageContent` (~line 1651)

**Step 1: Update Sidebar component to support mobile overlay mode**

Add `isMobile` and `onClose` props to `Sidebar`. When `isMobile` is true, render as a fixed fullscreen overlay with backdrop and close button. When not mobile, keep current behavior.

In the `Sidebar` function signature, add props:
```typescript
function Sidebar({
  active,
  onSelect,
  collapsed,
  isMobile,
  mobileOpen,
  onClose,
}: {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  collapsed: boolean;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
```

When `isMobile` is true:
- If `!mobileOpen`, return `null` (hidden)
- If `mobileOpen`, render as `fixed inset-0 z-50` with a backdrop div and the nav content filling the left side (w-64)
- On nav item click, also call `onClose`

When `isMobile` is false: keep existing behavior unchanged.

**Step 2: Update DashboardPageContent to pass mobile props**

In `DashboardPageContent`, add:
```typescript
const isMobile = useIsMobile();
const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
```

Pass to `<Sidebar>`:
```tsx
<Sidebar
  active={activeNav}
  onSelect={(key) => {
    setActiveNav(key);
    if (isMobile) setMobileSidebarOpen(false);
  }}
  collapsed={sidebarCollapsed}
  isMobile={isMobile}
  mobileOpen={mobileSidebarOpen}
  onClose={() => setMobileSidebarOpen(false)}
/>
```

On the outer `div` (line 1651): Hide sidebar space on mobile:
```tsx
<div className="relative flex h-screen ...">
  {!isMobile && <Sidebar ... />}
  {isMobile && <Sidebar ... />}  {/* renders as overlay via portal or fixed */}
```

**Step 3: Update TopBar hamburger to open mobile sidebar**

Pass `onToggleSidebar` to open the mobile sidebar when on mobile:
```typescript
onToggleSidebar={() => {
  if (isMobile) {
    setMobileSidebarOpen(prev => !prev);
  } else {
    setSidebarCollapsed(prev => !prev);
  }
}}
```

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: mobile sidebar as hamburger overlay on dashboard"
```

---

### Task 3: Make Dashboard Chat fullscreen on mobile

**Files:**
- Modify: `src/app/dashboard/page.tsx` — chat layout sections (~line 1670-1977)

**Step 1: On mobile, when chat is open, render it as a fullscreen overlay**

When `isMobile && !chatCollapsed`:
- Render chat as `fixed inset-0 z-40 bg-white flex flex-col` (fullscreen)
- Hide the resize handle entirely
- Hide the docked layout and overlay layout
- Add a close/back button in the chat header to collapse chat

When `isMobile && chatCollapsed`:
- Show the normal dashboard content (fullscreen, no sidebar)

**Step 2: Hide resize handles on mobile**

Wrap resize handle divs with `{!isMobile && (...)}` or add `hidden md:block` class.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: fullscreen chat on mobile dashboard"
```

---

### Task 4: Make Right Side Panel fullscreen overlay on mobile

**Files:**
- Modify: `src/app/dashboard/page.tsx` — right panel sections (~line 1714-1725, 1902-1914, 1953)

**Step 1: On mobile, render right panel as fixed fullscreen overlay**

When `isMobile && rightPanel`:
- Render as `fixed inset-0 z-50 bg-white p-4` with close button
- This replaces the `absolute` positioned 440px panel
- Remove the `style={{ left: chatWidth }}` positioning

When desktop: keep current 440px absolute/side layout.

**Step 2: In maximized chat view, hide the right panel side column on mobile**

The maximized view has `<div className="w-[440px] shrink-0 ...">` for the right panel. On mobile, this should be hidden or rendered as a fullscreen overlay instead.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: fullscreen right panel overlay on mobile"
```

---

### Task 5: Make Dashboard content responsive (KPIs, charts, tables)

**Files:**
- Modify: `src/app/dashboard/page.tsx` — `DashboardMain` and sub-sections

**Step 1: Fix KPI grid for mobile**

Line ~3869: Change `grid gap-4 md:grid-cols-5` to `grid grid-cols-2 gap-3 md:grid-cols-5` so KPIs stack in 2 columns on mobile.

**Step 2: Fix chart grid for mobile**

Line ~3939: The chart layout `grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` already stacks on mobile (since it's `lg:`). Verify it works. Reduce horizontal padding on mobile: `px-4 md:px-6`.

**Step 3: Fix ticket table for mobile**

The ticket table with 7 columns overflows on mobile. Wrap in a `overflow-x-auto` container. Also consider hiding less important columns on mobile with `hidden md:table-cell`.

**Step 4: Fix content container padding**

The `mx-auto w-full max-w-6xl space-y-8 px-6 py-10` containers should use `px-4 md:px-6 py-6 md:py-10` for tighter mobile spacing.

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: responsive KPIs, charts, and tables for mobile"
```

---

### Task 6: Make TopBar responsive

**Files:**
- Modify: `src/app/dashboard/page.tsx` — `TopBar` component (~line 2113-2158)

**Step 1: Reduce TopBar padding on mobile**

Change `px-6` to `px-3 md:px-6` and adjust button sizing for touch targets.

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: responsive TopBar padding"
```

---

### Task 7: Make Demo page mobile-friendly

**Files:**
- Modify: `src/app/demo/page.tsx`

**Step 1: Hide sidebar on mobile, show chat fullscreen**

The demo page has a fixed `w-60` sidebar. On mobile:
- Hide sidebar: `hidden md:flex` on the `<nav>` element (line 126)
- Chat takes full width
- Add mobile header with hamburger if needed

**Step 2: Fix chat container height**

The `maxHeight: "calc(100vh - 180px)"` inline style should become responsive. On mobile without the top bar header, it should be `calc(100dvh - 120px)` or similar.

**Step 3: Commit**

```bash
git add src/app/demo/page.tsx
git commit -m "feat: mobile-friendly demo page"
```

---

### Task 8: Make Landing page fully responsive

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Verify modal responsiveness**

The invite popup already uses `w-[min(90vw,24rem)]` which is good. Verify the form grid `grid-cols-2` for name fields works on very small screens — if not, change to `grid-cols-1 sm:grid-cols-2`.

**Step 2: Fix CTA cards layout**

Ensure the CTA option cards stack properly on mobile with adequate padding.

**Step 3: Fix text area and input sizing**

Ensure chat input area has proper mobile sizing.

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: mobile-responsive landing page"
```

---

### Task 9: Make Login/Signup/Reset pages mobile-friendly

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/reset/page.tsx`

**Step 1: Verify login page mobile layout**

Login already has `hidden lg:flex` for left panel and a mobile logo. Ensure:
- Form padding: `p-4 md:p-8`
- Input sizes work well on mobile (h-14 is fine)

**Step 2: Apply same patterns to signup and reset**

Check if they follow the same split-panel pattern and apply consistent mobile treatment.

**Step 3: Commit**

```bash
git add src/app/login/page.tsx src/app/signup/page.tsx src/app/reset/page.tsx
git commit -m "feat: mobile-friendly auth pages"
```

---

### Task 10: Make Onboarding widgets mobile-friendly

**Files:**
- Modify: `src/components/onboarding/UserInfoFormWidget.tsx`
- Modify: various other onboarding widget files as needed

**Step 1: Fix name fields grid**

In `UserInfoFormWidget.tsx`, if there's a `grid-cols-2` for name fields, change to `grid-cols-1 sm:grid-cols-2`.

**Step 2: Verify all widget forms have adequate padding**

Check `MachineDetailsFormWidget.tsx`, `ProfileConfigFormWidget.tsx`, etc. for any fixed-width elements that overflow on mobile.

**Step 3: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat: mobile-friendly onboarding widgets"
```

---

### Task 11: Verify and fix modals/dialogs for mobile

**Files:**
- Modify: `src/app/dashboard/page.tsx` — `ShareModal`, `NewTicketModal`
- Modify: `src/components/SMSConsentPopup.tsx`

**Step 1: Ensure all Dialog content uses responsive max-width**

Any `max-w-2xl` or `max-w-3xl` modal content should also have `w-full` and a mobile-safe max-width like `max-w-[calc(100vw-32px)]`.

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/SMSConsentPopup.tsx
git commit -m "feat: mobile-safe modal sizing"
```

---

### Task 12: Final verification

**Step 1: Test at 375px width**

Open Chrome DevTools, set viewport to 375px wide. Navigate through:
- Landing page → CTA cards, invite modal
- Login/Signup
- Demo page → chat
- Dashboard → sidebar toggle, chat toggle, KPIs, charts, tickets, right panel

**Step 2: Fix any remaining overflow issues**

Look for horizontal scrollbars, text truncation, or elements extending beyond the viewport.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: remaining mobile responsive adjustments"
```
