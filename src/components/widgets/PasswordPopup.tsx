"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordCreationWidget, type StepInfo, type PasswordCreationStep } from "../onboarding/PasswordCreationWidget";

interface PasswordPopupProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  phoneNumber?: string;
}

export function PasswordPopup({ isOpen, onClose, email: propEmail, phoneNumber: propPhoneNumber }: PasswordPopupProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState(propEmail || '');
  const [userPhone, setUserPhone] = useState(propPhoneNumber || '');
  const [currentStep, setCurrentStep] = useState<PasswordCreationStep>('select-method');
  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null);

  // Load email and phone from localStorage on mount
  useEffect(() => {
    if (!propEmail || !propPhoneNumber) {
      const onboardingStateRaw = localStorage.getItem("onboarding_state");
      if (onboardingStateRaw) {
        try {
          const state = JSON.parse(onboardingStateRaw);
          if (!propEmail && state.email) setUserEmail(state.email);
          if (!propPhoneNumber && state.phoneNumber) setUserPhone(state.phoneNumber);
        } catch (e) {
          console.error("Failed to parse onboarding state:", e);
        }
      }
    }
  }, [propEmail, propPhoneNumber]);

  // Fallback to demo values if still empty
  const displayEmail = userEmail || "demo@example.com";
  const displayPhone = userPhone || "+1 555-123-4567";

  // Handle step changes from the widget
  const handleStepChange = useCallback((info: StepInfo) => {
    setCurrentStep(info.step);
    setStepInfo(info);
  }, []);

  // Get title and description based on current step
  const getHeaderContent = () => {
    switch (currentStep) {
      case 'select-method':
        return {
          title: 'Verify Your Identity',
          description: 'Choose how you\'d like to receive your verification code'
        };
      case 'verify-otp':
        return {
          title: 'Verify Your OTP',
          description: stepInfo?.selectedMethod === 'email'
            ? `Code sent to ${stepInfo?.maskedEmail || '...'}`
            : `Code sent to ${stepInfo?.maskedPhone || '...'}`
        };
      case 'create-password':
        return {
          title: 'Set Your Password',
          description: 'Create a secure password to access your dashboard and manage your machines.'
        };
      default:
        return {
          title: 'Verify Your Identity',
          description: 'Choose how you\'d like to receive your verification code'
        };
    }
  };

  const headerContent = getHeaderContent();

  if (!isOpen) return null;

  const handlePasswordSubmit = async (_password: string) => {
    setIsSubmitting(true);
    try {
      // Store password locally for demo purposes
      localStorage.setItem("demo_password_set", "true");

      // Create user session
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(
        "user_session",
        JSON.stringify({ email: displayEmail, userId }),
      );

      // Update onboarding state
      const onboardingStateRaw = localStorage.getItem("onboarding_state");
      if (onboardingStateRaw) {
        const state = JSON.parse(onboardingStateRaw);
        localStorage.setItem(
          "onboarding_state",
          JSON.stringify({ ...state, shouldContinue: true, email: displayEmail }),
        );
      } else {
        localStorage.setItem(
          "onboarding_state",
          JSON.stringify({ shouldContinue: true, email: displayEmail }),
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
            {headerContent.title}
          </h2>

          {/* Description */}
          <p className="mb-6 text-center text-sm text-slate-600 leading-relaxed">
            {headerContent.description}
          </p>

          {/* Password Form */}
          <PasswordCreationWidget
            onSubmit={handlePasswordSubmit}
            hideHeader
            embedded
            email={displayEmail}
            phoneNumber={displayPhone}
            onStepChange={handleStepChange}
          />

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