# Invite Form Consolidation Design

## Problem

User info collection (first name, last name, email) happens in the onboarding chat via `UserInfoFormWidget`, separate from the invite code entry on the landing page. This creates a disjointed experience.

## Solution

Consolidate user info collection into the invite code modal on the landing page. Remove the form from the chat.

## Invite Modal Flow

### Step 1: Invite Form (default)

- **Header:** Welcoming greeting
- **Subheader:** "Enter your details and invite code to get started"
- **Fields:**
  - First name + Last name (side by side, one row)
  - Email
  - Invite code
- **Terms checkbox** (existing)
- **Primary CTA:** "Continue" (full width, disabled until valid + terms accepted)
- **Secondary link:** "Don't have a code? Request one"

**Validation:**
- All fields required
- Email format validation
- Inline error messages beneath each field

### Step 2: Request a Code (slides in from right)

- **Back arrow** top-left to slide back to Step 1
- **Header:** "Request an Invite Code"
- **Subheader:** "Enter your phone number and we'll text you a code"
- **Field:** Phone number
- **CTA:** "Send Code"
- On success: slides back to Step 1 with green success banner ("Code sent! Check your phone."), auto-dismisses after 5s

### Transitions

- Modal shell (border, backdrop, close button) stays fixed
- Inner content transitions with horizontal slide (~300ms ease)
- Container uses `overflow: hidden` with animated height
- Step 1 slides out left, Step 2 slides in from right (reverse on back)

## Onboarding Chat Changes

### Removed

- `UserInfoFormWidget` no longer appears in chat
- `user-info-prompt` and `user-info-processing` states bypassed in `NON_LOGIN_FLOW`

### New Flow

1. Invite modal submits → store first name, last name, email, invite code in localStorage
2. Route to `/onboarding`
3. Chat starts with OTP: "We've sent a verification code to [email]" + `OtpFormWidget`
4. After OTP → device selection (demo vs live)
5. Rest of flow unchanged

## Visual Design

- Soft gradient border, backdrop blur (existing aesthetic)
- `animate-fade-in-up` on open
- Clean rounded inputs, purple focus rings
- Inline validation errors in rose, fade-in animation
- First name + last name: `grid grid-cols-2 gap-3`
- Button states: disabled (reduced opacity), loading (spinner), hover (brightness lift)
- Success banner: green, top of Step 1, auto-dismiss 5s
