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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-purple-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Set Your Password
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="mb-6 text-sm text-slate-600">
          Create a secure password to access your dashboard and manage your machines.
        </p>

        {/* Password Form */}
        <PasswordCreationWidget onSubmit={handlePasswordSubmit} />

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
  );
}