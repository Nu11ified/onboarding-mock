"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordCreationWidget } from "../onboarding/PasswordCreationWidget";

interface PasswordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
}

export function PasswordPopup({ isOpen, onClose, email }: PasswordPopupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (_password: string) => {
    setIsSubmitting(true);
    try {
      // Get email from localStorage or use the provided email
      let userEmail = email;
      if (!userEmail) {
        const onboardingStateRaw = localStorage.getItem("onboarding_state");
        if (onboardingStateRaw) {
          const state = JSON.parse(onboardingStateRaw);
          userEmail = state.email;
        }
      }
      
      // Fallback to demo email
      if (!userEmail) {
        userEmail = "demo@example.com";
      }

      // Store password locally for demo purposes
      localStorage.setItem("demo_password_set", "true");
      
      // Create user session
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(
        "user_session",
        JSON.stringify({ email: userEmail, userId }),
      );

      // Update onboarding state
      const onboardingStateRaw = localStorage.getItem("onboarding_state");
      if (onboardingStateRaw) {
        const state = JSON.parse(onboardingStateRaw);
        localStorage.setItem(
          "onboarding_state",
          JSON.stringify({ ...state, shouldContinue: true, email: userEmail }),
        );
      } else {
        localStorage.setItem(
          "onboarding_state",
          JSON.stringify({ shouldContinue: true, email: userEmail }),
        );
      }

      // Redirect to dashboard
      router.replace(
        "/dashboard?onboarded=true&showDashboard=true&autoSelectMachine=true",
      );
    } catch (error) {
      console.error("Error setting password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-1 shadow-2xl">
        <div className="rounded-[22px] bg-white p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-6 right-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight text-slate-900">
            Set Your Password
          </h2>

          {/* Description */}
          <p className="mb-6 text-center text-sm text-slate-600 leading-relaxed">
            Create a secure password to access your dashboard and manage your machines.
          </p>

          {/* Password Form */}
          <PasswordCreationWidget onSubmit={handlePasswordSubmit} hideHeader />

          {/* Cancel Button */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}