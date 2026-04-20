"use client";

import { useState, useEffect, useMemo } from "react";
import type { VIC } from "@/types/vic";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

type Phase = "initializing" | "searching" | "analyzing" | "complete";

interface SearchSource {
  name: string;
  done: boolean;
}

interface InsightCard {
  label: string;
  value: string;
  icon?: string;
}

type Props = {
  vic: VIC;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedVic: VIC) => void;
};

// Particle animation background component
function ParticleBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-[var(--muted-info-text)] rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes count-up {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function AcuitySimulation({
  vic,
  isOpen,
  onClose,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("initializing");
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [insightCount, setInsightCount] = useState(0);
  const [summaryShown, setSummaryShown] = useState(false);

  // Phase 1: Initializing (2 seconds)
  useEffect(() => {
    if (!isOpen || phase !== "initializing") return;

    const timer = setTimeout(() => {
      setPhase("searching");
      setSources([
        { name: "Searching public records…", done: false },
        { name: "Analyzing social media presence…", done: false },
        { name: "Cross-referencing travel databases…", done: false },
        { name: "Mining professional networks…", done: false },
        { name: "Scanning luxury publications…", done: false },
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen, phase]);

  // Phase 2: Searching - stagger the sources
  useEffect(() => {
    if (phase !== "searching") return;

    let completedCount = 0;
    const timers: NodeJS.Timeout[] = [];

    sources.forEach((_, index) => {
      const timer = setTimeout(() => {
        setSources((prev) => {
          const next = [...prev];
          next[index].done = true;
          return next;
        });
        completedCount++;

        if (completedCount === sources.length) {
          setTimeout(() => {
            setPhase("analyzing");
          }, 300);
        }
      }, (index + 1) * 500);

      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [phase, sources.length]);

  // Phase 3: Analyzing (2 seconds) - animate insights
  useEffect(() => {
    if (phase !== "analyzing") return;

    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setInsightCount(count);

      if (count >= 12) {
        clearInterval(timer);
        setTimeout(() => {
          setPhase("complete");
          setSummaryShown(true);
        }, 500);
      }
    }, 140);

    return () => clearInterval(timer);
  }, [phase]);

  const insights: InsightCard[] = [
    { label: "Wine preferences discovered", value: "Burgundy, Tuscany, Bordeaux" },
    { label: "Travel pace identified", value: "Moderate (7-10 days per trip)" },
    { label: "Accommodation style", value: "Luxury properties, understated elegance" },
    { label: "Seasonal patterns", value: "Spring & fall preference (60% of travel)" },
    { label: "Travel companions", value: "Spouse primary, occasional business partners" },
    { label: "Culinary interest", value: "Michelin-star dining, wine pairing focus" },
  ];

  const handleViewProfile = () => {
    const updatedVic: VIC = {
      ...vic,
      acuity_status: "complete",
      acuity_last_run: new Date().toISOString(),
      acuity_provider: "Gemini",
      acuity_confidence: "high",
    };
    onComplete(updatedVic);
    onClose();
  };

  const handleRunAgain = () => {
    setPhase("initializing");
    setSources([]);
    setInsightCount(0);
    setSummaryShown(false);
  };

  const progressPercent =
    phase === "searching"
      ? (sources.filter((s) => s.done).length / sources.length) * 100
      : phase === "analyzing"
        ? (insightCount / 12) * 100
        : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl relative overflow-hidden">
        <ParticleBackground />

        <div className="relative z-10">
          {/* Phase 1: Initializing */}
          {phase === "initializing" && (
            <div className="space-y-6 py-8 text-center">
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <ImageWithFallback
                    fallbackType="avatar"
                    alt={vic.full_name ?? "VIC"}
                    name={vic.full_name ?? "?"}
                    className="w-20 h-20 rounded-lg ring-2 ring-[var(--muted-info-text)]/40"
                  />
                  <div className="absolute inset-0 rounded-lg ring-2 ring-[var(--muted-info-text)] animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {vic.full_name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Preparing intelligence request…
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-4">
                <div
                  className="w-2 h-2 bg-[var(--muted-info-text)] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-[var(--muted-info-text)] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-[var(--muted-info-text)] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <p className="text-xs text-muted-foreground pt-4">
                Powered by Gemini 2.0
              </p>
            </div>
          )}

          {/* Phase 2: Searching */}
          {phase === "searching" && (
            <div className="space-y-6 py-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Searching sources…
                </h3>
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 text-sm"
                      style={{
                        animation: `slide-in 0.4s ease-out ${idx * 0.5}s both`,
                      }}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          source.done
                            ? "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]"
                            : "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]"
                        )}
                      >
                        {source.done ? "✓" : "•"}
                      </span>
                      <span
                        className={cn(
                          "flex-1",
                          source.done
                            ? "text-muted-foreground/70"
                            : "text-foreground"
                        )}
                      >
                        {source.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--muted-info-text)] to-[var(--muted-info-text)]/50 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {sources.filter((s) => s.done).length} / {sources.length}{" "}
                  sources indexed
                </p>
              </div>
            </div>
          )}

          {/* Phase 3: Analyzing */}
          {phase === "analyzing" && (
            <div className="space-y-6 py-6">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Processing 47 signals…
                </p>
                <p className="text-sm text-muted-foreground">
                  Building preference model…
                </p>
                <p className="text-sm text-muted-foreground">
                  Confidence scoring…
                </p>
              </div>

              <div className="bg-[rgba(59,130,246,0.1)] border border-[var(--muted-info-border)] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--muted-info-bg)]">
                      <span
                        className="text-lg font-bold text-[var(--muted-info-text)]"
                        style={{
                          animation: `count-up 0.6s ease-out`,
                        }}
                      >
                        {insightCount}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    new insights discovered
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--muted-info-text)] to-[var(--muted-success-text)] transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Phase 4: Complete */}
          {phase === "complete" && summaryShown && (
            <div className="space-y-6 py-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Intelligence Complete
                </h3>
                <div className="bg-[rgba(34,197,94,0.1)] border border-[var(--muted-success-border)] rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[var(--muted-success-bg)]">
                        <span className="text-lg text-[var(--muted-success-text)]">
                          ✓
                        </span>
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Synthesized from 47 sources
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        3 new travel preferences identified • 2 relationship
                        insights added
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary insights */}
              <div className="grid grid-cols-1 gap-3">
                {insights.slice(0, insightCount / 2).map((insight, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-3 bg-foreground/[0.03]"
                    style={{
                      animation: `slide-in 0.4s ease-out ${idx * 0.1}s both`,
                    }}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {insight.label}
                    </p>
                    <p className="text-sm text-foreground">{insight.value}</p>
                  </div>
                ))}
              </div>

              {/* Confidence badge */}
              <div className="flex items-center gap-2 p-3 bg-foreground/[0.04] rounded-lg">
                <span className="text-xs font-medium text-muted-foreground">
                  Confidence:
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]">
                  HIGH
                </span>
              </div>

              {/* CTAs */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleViewProfile}
                  className="flex-1 bg-[var(--muted-info-text)] hover:bg-[var(--muted-info-text)]/90"
                >
                  View Updated Profile
                </Button>
                <Button onClick={handleRunAgain} variant="outline" className="flex-1">
                  Run Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
