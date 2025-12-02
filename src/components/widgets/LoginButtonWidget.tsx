"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoginButtonWidgetProps {
  buttonText?: string;
  url: string;
  message?: string;
  onSubmit?: () => void;
}

export function LoginButtonWidget({
  buttonText = "Resend Email",
  url,
  message = "Please secure your account to continue.",
  onSubmit,
}: LoginButtonWidgetProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onSubmit) onSubmit();
    router.push(url);
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 shadow-md">
          <Lock className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 mb-3">
            Check your email
          </h3>
          <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
            {message.split('\n').map((line, index) => {
              if (!line.trim()) return null;
              return (
                <p key={index} className={cn(
                  "leading-relaxed",
                  index === 0 && "font-medium text-slate-700"
                )}>
                  {line}
                </p>
              );
            })}
          </div>

          <div className="mt-4">
            <Button
              onClick={handleClick}
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
