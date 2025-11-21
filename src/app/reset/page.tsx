"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  // Wrap the client hooks in suspense so Next.js can defer rendering when search params are unavailable.
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bypass token validation for demo flexibility
  useEffect(() => {
    if (!token) {
       // Check if we have a pending email, if so, we can proceed without token
       const pendingEmail = localStorage.getItem("pending_reset_email");
       if (!pendingEmail) {
         // Only error if we really have no context
         // But for now, let's just warn or leave it be, user wants to set password regardless
       }
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // if (!token) return; // Removed for bypass

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Complete reset
      // If no token, try to find email from localStorage
      const pendingEmailRaw = localStorage.getItem("pending_reset_email");
      const email = pendingEmailRaw ? JSON.parse(pendingEmailRaw) : null;

      const complete = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-password-reset",
          token: token || undefined,
          password,
          email: !token ? email : undefined, // Send email if token is missing
        }),
      });
      const completeData = await complete.json();
      if (!complete.ok || !completeData?.success) {
        throw new Error(completeData?.error || "Failed to reset password");
      }

      // For demo purposes, login immediately after reset.
      // Reuse the email variable defined above
      if (email) {
        const loginRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData?.success) {
          localStorage.setItem(
            "user_session",
            JSON.stringify({ email, userId: loginData.userId }),
          );
        }
      }

      // Signal onboarding to continue
      const onboardingStateRaw = localStorage.getItem("onboarding_state");
      if (onboardingStateRaw) {
        try {
          const state = JSON.parse(onboardingStateRaw);
          localStorage.setItem(
            "onboarding_state",
            JSON.stringify({ ...state, shouldContinue: true }),
          );
        } catch {}
      }

      // Redirect to dashboard handoff page
      router.replace(
        "/demo/dashboard?onboarded=true&showDashboard=true&autoSelectMachine=true",
      );
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">
          Set your password
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Create a password to secure your account and continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Setting password..." : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="rounded-xl border border-purple-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
        Preparing your reset experience...
      </div>
    </div>
  );
}
