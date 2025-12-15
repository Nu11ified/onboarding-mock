"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginButtonWidgetProps {
  buttonText?: string;
  url?: string;
  message?: string;
  onSubmit?: () => void;
  onShowPopup?: () => void;
}

export function LoginButtonWidget({
  buttonText = "Set Password",
  url,
  message = "Please secure your account to continue.",
  onSubmit,
  onShowPopup,
}: LoginButtonWidgetProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onShowPopup) {
      onShowPopup();
    } else if (onSubmit) {
      onSubmit();
    } else if (url) {
      router.push(url);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
          <Lock className="h-5 w-5 text-purple-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Secure Your Account
          </h3>
          <p className="mt-1 text-sm text-slate-600">{message}</p>

          <div className="mt-3">
            <Button
              onClick={handleClick}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-purple-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Tip:</span> Create a strong password
          with at least 8 characters, including uppercase, lowercase, and numbers.
        </p>
      </div>
    </div>
  );
}
