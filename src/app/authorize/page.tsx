"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowLeftRight } from "lucide-react";

export default function AuthorizePage() {
  const router = useRouter();
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
        <div className="w-full max-w-lg rounded-2xl border border-purple-200 bg-white p-6 md:p-8 shadow-sm">
          {/* Title */}
          <h1 className="mb-5 text-xl font-semibold text-slate-900">
            Authorize Microsoft Teams
          </h1>

          {/* App Icons */}
          <div className="mb-5 flex items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#464EB8]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/teams.svg"
                alt="Microsoft Teams"
                className="h-9 w-9"
              />
            </div>
            <ArrowLeftRight className="h-5 w-5 text-slate-400" />
            <div className="flex h-14 items-center justify-center rounded-xl bg-purple-50 px-3">
              <Image
                src="/microai-logo-dark.svg"
                alt="MicroAI"
                width={80}
                height={24}
                className="h-6 w-auto"
              />
            </div>
          </div>

          {/* Description */}
          <p className="mb-6 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              Microsoft Teams
            </span>{" "}
            wants to access your account information.
          </p>

          {/* Permissions */}
          <div className="mb-6 space-y-0 divide-y divide-slate-100">
            <div className="flex items-start gap-3 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  View your basic profile
                </p>
                <p className="text-sm text-slate-500">
                  Access your name, email, and profile picture
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Access your Usecase profiles
                </p>
                <p className="text-sm text-slate-500">
                  Read your Usecase profiles and activity data
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/authorize/allow"
              className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              ALLOW
            </Link>
            <Link
              href="/authorize/deny"
              className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              DENY
            </Link>
          </div>

          {/* Fine print */}
          <p className="mt-5 text-xs text-slate-400">
            By clicking Allow, you authorize Microsoft Teams to access the data
            described above. You can revoke access at any time from your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
