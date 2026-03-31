"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ArrowRight, X, Cloud } from "lucide-react";

type DemoStage = 1 | 2 | 3 | 4;

interface CounterState {
  axusProfiles: number;
  googleDocuments: number;
  virtuosoPrograms: number;
  jcItineraries: number;
  jcProducts: number;
  commissionsMatched: number;
  conflictsDetected: number;
}

export type DataIngestionDemoProps = {
  onComplete: () => void;
  onSkip: () => void;
};

export function DataIngestionDemo({ onComplete, onSkip }: DataIngestionDemoProps) {
  const [stage, setStage] = useState<DemoStage>(1);
  const [counters, setCounters] = useState<CounterState>({
    axusProfiles: 0,
    googleDocuments: 0,
    virtuosoPrograms: 0,
    jcItineraries: 0,
    jcProducts: 0,
    commissionsMatched: 0,
    conflictsDetected: 0,
  });

  const [isAnimating, setIsAnimating] = useState(true);

  // Animate counters when stage changes
  useEffect(() => {
    if (!isAnimating) return;

    if (stage === 2) {
      const timeoutIds: (NodeJS.Timeout | number)[] = [];
      const frameIds: number[] = [];
      const targets = {
        axusProfiles: 12,
        googleDocuments: 847,
        virtuosoPrograms: 23,
      };

      Object.entries(targets).forEach(([key, target], index) => {
        const startTime = Date.now();
        const duration = 1500;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const value = Math.floor(target * easeOut);

          setCounters((prev) => ({
            ...prev,
            [key]: value,
          }));

          if (progress < 1) {
            frameIds.push(requestAnimationFrame(animate));
          }
        };

        timeoutIds.push(window.setTimeout(() => requestAnimationFrame(animate), index * 200) as unknown as NodeJS.Timeout);
      });

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id as unknown as NodeJS.Timeout));
        frameIds.forEach(cancelAnimationFrame);
      };
    }

    if (stage === 3) {
      const timeoutIds: (NodeJS.Timeout | number)[] = [];
      const frameIds: number[] = [];
      const targets = {
        jcItineraries: 3,
        jcProducts: 8,
        commissionsMatched: 15,
        conflictsDetected: 4,
      };

      Object.entries(targets).forEach(([key, target], index) => {
        const startTime = Date.now();
        const duration = 1200;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const value = Math.floor(target * easeOut);

          setCounters((prev) => ({
            ...prev,
            [key]: value,
          }));

          if (progress < 1) {
            frameIds.push(requestAnimationFrame(animate));
          }
        };

        timeoutIds.push(window.setTimeout(() => requestAnimationFrame(animate), index * 150) as unknown as NodeJS.Timeout);
      });

      return () => {
        timeoutIds.forEach((id) => clearTimeout(id as unknown as NodeJS.Timeout));
        frameIds.forEach(cancelAnimationFrame);
      };
    }
  }, [stage, isAnimating]);

  // Auto-advance stages every 3-4 seconds
  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      if (stage < 4) {
        setStage((s) => (s + 1) as DemoStage);
      } else {
        setIsAnimating(false);
      }
    }, stage === 1 ? 3000 : stage === 2 ? 3500 : stage === 3 ? 3500 : 2500);

    return () => clearTimeout(timer);
  }, [stage, isAnimating]);

  const handleSkipDemo = () => {
    setIsAnimating(false);
    onComplete();
  };

  const progress = ((stage - 1) / 3) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full">
        {/* Skip button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">Setting up your workspace</h2>
          <button
            onClick={handleSkipDemo}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Skip demo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main content area with fade transition */}
        <div className="relative min-h-[400px] p-8 rounded-2xl bg-card border border-input mb-6">
          {/* Stage 1: Connecting Sources */}
          {stage >= 1 && (
            <div
              className={`transition-opacity duration-500 ${stage === 1 ? "opacity-100" : "opacity-0 absolute inset-0"}`}
            >
              {stage === 1 && (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Connecting sources</h3>
                    <p className="text-sm text-muted-foreground/75">
                      Establishing secure connections to your data sources
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-8">
                    {/* Axus */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white/5 border border-input flex items-center justify-center relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          AX
                        </div>
                        <div className="absolute inset-0 rounded-xl animate-pulse bg-blue-500/20" />
                      </div>
                      <p className="text-xs text-muted-foreground">Axus</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#7AA3C8] animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-[#7AA3C8] animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 rounded-full bg-[#7AA3C8] animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                      <ArrowRight className="w-5 h-5" />
                    </div>

                    {/* Google Drive */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white/5 border border-input flex items-center justify-center relative">
                        <Cloud className="w-8 h-8 text-[#4285F4]" />
                        <div className="absolute inset-0 rounded-xl animate-pulse bg-blue-500/20" />
                      </div>
                      <p className="text-xs text-muted-foreground">Google Drive</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 rounded-full bg-[#D4A574] animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                      <ArrowRight className="w-5 h-5" />
                    </div>

                    {/* Virtuoso */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white/5 border border-input flex items-center justify-center relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          VR
                        </div>
                        <div className="absolute inset-0 rounded-xl animate-pulse bg-purple-500/20" />
                      </div>
                      <p className="text-xs text-muted-foreground">Virtuoso</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#C87A7A] animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-[#C87A7A] animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 rounded-full bg-[#C87A7A] animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 2: Extracting Data */}
          {stage >= 2 && (
            <div
              className={`transition-opacity duration-500 ${stage === 2 ? "opacity-100" : "opacity-0 absolute inset-0"}`}
            >
              {stage === 2 && (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Extracting data</h3>
                    <p className="text-sm text-muted-foreground/75">
                      Scanning and cataloging information from connected sources
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Axus Profiles */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">VIC profiles found in Axus</span>
                        <span className="text-sm font-semibold text-[#AE8550]">{counters.axusProfiles}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7AA3C8] to-[#5A83A8] transition-all duration-300"
                          style={{ width: `${(counters.axusProfiles / 12) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Google Documents */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Documents synced from Google Drive</span>
                        <span className="text-sm font-semibold text-[#AE8550]">{counters.googleDocuments}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#D4A574] to-[#B4851F] transition-all duration-300"
                          style={{ width: `${(counters.googleDocuments / 847) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Virtuoso Programs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Partner programs from Virtuoso</span>
                        <span className="text-sm font-semibold text-[#AE8550]">{counters.virtuosoPrograms}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C87A7A] to-[#A85555] transition-all duration-300"
                          style={{ width: `${(counters.virtuosoPrograms / 23) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 3: Building Intelligence */}
          {stage >= 3 && (
            <div
              className={`transition-opacity duration-500 ${stage === 3 ? "opacity-100" : "opacity-0 absolute inset-0"}`}
            >
              {stage === 3 && (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Building intelligence</h3>
                    <p className="text-sm text-muted-foreground/75">
                      Linking entities and detecting relationships across sources
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* JC Chopin linking */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 space-y-2">
                      <p className="text-sm text-foreground">
                        Linking JC Chopin →{" "}
                        <span className="text-[#AE8550] font-semibold">{counters.jcItineraries} itineraries</span>,{" "}
                        <span className="text-[#AE8550] font-semibold">{counters.jcProducts} products</span>
                      </p>
                      <div className="flex gap-2 items-center text-xs text-muted-foreground/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7CB889] animate-pulse" />
                        <span>Entity linking in progress</span>
                      </div>
                    </div>

                    {/* Commission matching */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 space-y-2">
                      <p className="text-sm text-foreground">
                        Commission data matched for{" "}
                        <span className="text-[#AE8550] font-semibold">{counters.commissionsMatched} programs</span>
                      </p>
                      <div className="flex gap-2 items-center text-xs text-muted-foreground/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7CB889] animate-pulse" />
                        <span>Cross-referencing commission data</span>
                      </div>
                    </div>

                    {/* Conflict detection */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10 space-y-2">
                      <p className="text-sm text-foreground">
                        <span className="text-[#D4A574] font-semibold">{counters.conflictsDetected} conflicts</span> detected — ready for review
                      </p>
                      <div className="flex gap-2 items-center text-xs text-muted-foreground/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4A574] animate-pulse" />
                        <span>Analyzing data inconsistencies</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stage 4: Ready */}
          {stage >= 4 && (
            <div
              className={`transition-opacity duration-500 ${stage === 4 ? "opacity-100" : "opacity-0 absolute inset-0"}`}
            >
              {stage === 4 && (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-semibold text-foreground mb-2">Your workspace is ready</h3>
                    <p className="text-sm text-muted-foreground/75">
                      Everything is loaded and synchronized
                    </p>
                  </div>

                  {/* Mini dashboard preview */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* VIC Profiles card */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                      <p className="text-xs text-muted-foreground/75 mb-2">VIC Profiles</p>
                      <p className="text-2xl font-semibold text-[#AE8550]">12</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Active records</p>
                    </div>

                    {/* Upcoming Trips card */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                      <p className="text-xs text-muted-foreground/75 mb-2">Upcoming Trips</p>
                      <p className="text-2xl font-semibold text-[#7CB889]">3</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">This month</p>
                    </div>

                    {/* Action Items card */}
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                      <p className="text-xs text-muted-foreground/75 mb-2">Action Items</p>
                      <p className="text-2xl font-semibold text-[#D4A574]">4</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">To review</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/75 pt-2">
                    <div className="w-2 h-2 rounded-full bg-[#7CB889]" />
                    <span>All systems synchronized</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-3 mb-6">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#AE8550] to-[#C4975E] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/60 text-center">
            Step {stage} of 4
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSkipDemo}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors"
          >
            Skip demo
          </button>
          {stage === 4 && (
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#AE8550] hover:bg-[#C4975E] text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
