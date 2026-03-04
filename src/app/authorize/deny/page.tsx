"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default function AuthorizeDenyPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {}
    }
  }, []);

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-purple-100">
      {/* Top Bar */}
      <header className="relative z-20 border-b border-purple-100/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-8">
            <Image
              src="/microai-logo-dark.svg"
              alt="MicroAI"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                {userInitials}
              </div>
              <span className="text-sm font-medium text-purple-900">
                {user?.email || "User"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-purple-200 bg-white p-6 md:p-8 shadow-sm text-center">
          {/* Denied Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-9 w-9 text-red-500" />
          </div>

          <h1 className="mb-2 text-xl font-semibold text-slate-900">
            Authorization Denied
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            You&apos;ve denied{" "}
            <span className="font-semibold text-slate-900">
              Microsoft Teams
            </span>{" "}
            access to your account. No data has been shared.
          </p>

          {/* Info box */}
          <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
            <p className="text-sm text-slate-600">
              If this was a mistake, you can return to the authorization page and
              try again. Microsoft Teams will not be able to access your account
              until you grant permission.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/authorize"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Go Back
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
            >
              Return to Dashboard
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            You can authorize Microsoft Teams at any time by returning to this
            page.
          </p>
        </div>
      </div>
    </div>
  );
}
