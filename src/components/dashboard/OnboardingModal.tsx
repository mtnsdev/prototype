"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "travellustre_onboarding_complete";

export type OnboardingModalProps = {
  onComplete: () => void;
  onSkip: () => void;
  onGoToWizard: () => void;
};

type Step = 1 | 2 | 3;

export function OnboardingModal({ onComplete, onSkip, onGoToWizard }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onSkip]);

  useEffect(() => {
    if (step === 2) {
      const el = document.querySelector("[data-onboarding-chat-input]");
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    } else if (step === 3) {
      const el = document.querySelector("[data-onboarding-knowledge]");
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (containerRef.current && step >= 2) {
      const focusable = containerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "true");
    onSkip();
  }, [onSkip]);

  const content = (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={handleSkip}
      />

      {/* Highlight ring for steps 2 & 3 */}
      {step >= 2 && highlightRect && (
        <div
          className="absolute border-2 border-[#AE8550] rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            left: highlightRect.left - 8,
            top: highlightRect.top - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
          aria-hidden
        />
      )}

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="relative bg-[#161616] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <Image src="/TL_logo.svg" alt="TravelLustre" width={40} height={40} />
          </div>
          <h1 id="onboarding-title" className="text-[22px] font-semibold text-[#F5F5F5] mb-3">
            Welcome to TravelLustre
          </h1>
          <p className="text-[14px] text-[rgba(245,245,245,0.7)] leading-relaxed mb-8">
            Your AI assistant for luxury travel intelligence. Ask questions, find commissions, and build
            itineraries — all powered by your connected knowledge sources.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-[#AE8550] hover:bg-[#C4975E] text-white"
            >
              Get started →
            </Button>
            <button
              type="button"
              onClick={handleSkip}
              className="text-[13px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] underline underline-offset-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Chat coach mark */}
      {step === 2 && (
        <div className="relative max-w-sm w-full mx-4">
          <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 shadow-xl">
            <p className="text-[14px] text-[#F5F5F5] leading-relaxed">
              Ask anything — commission rates, hotel amenities, GDS codes. TravelLustre searches your
              knowledge sources to answer.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="border-white/20">
                ← Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)} className="bg-[#AE8550] hover:bg-[#C4975E]">
                Next →
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="block mt-3 text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] underline"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Step 3: Knowledge coach mark */}
      {step === 3 && (
        <div className="relative max-w-sm w-full mx-4">
          <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 shadow-xl">
            <p className="text-[14px] text-[#F5F5F5] leading-relaxed">
              These are the sources TravelLustre searches. Connect them to get accurate, up-to-date
              answers.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={onGoToWizard}
                className="w-full bg-[#AE8550] hover:bg-[#C4975E] text-white"
              >
                Connect your sources →
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-[rgba(245,245,245,0.7)]">
                I&apos;ll do this later
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="border-white/20">
                ← Back
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="block mt-3 text-[12px] text-[rgba(245,245,245,0.5)] hover:text-[#F5F5F5] underline"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
