"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database, Check } from "lucide-react";
import { useUserOptional } from "@/contexts/UserContext";
import { useGoogleDriveStatus } from "@/hooks/useGoogleDriveStatus";
import { useClaromentisStatus } from "@/hooks/useClaromentisStatus";
import { INTEGRATION_DEFINITIONS } from "@/lib/integrations/registry";
import { DataIngestionDemo } from "./DataIngestionDemo";

const ONBOARDING_KEY = "travellustre_onboarding_complete";

type WizardScreen = "overview" | "connect" | "ingestion-demo" | "confirmation";

type SourceSlot = {
  key: string;
  label: string;
  description: string;
  connected: boolean;
  connectHref?: string;
};

export type OnboardingWizardProps = {
  onComplete: () => void;
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const user = useUserOptional();
  const { status: personalDriveStatus } = useGoogleDriveStatus("personal");
  const { status: agencyDriveStatus } = useGoogleDriveStatus("agency");
  const claromentisStatus = useClaromentisStatus();

  const [screen, setScreen] = useState<WizardScreen>("overview");
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(new Set());
  const [connectedKeys, setConnectedKeys] = useState<Set<string>>(new Set());

  const claromentisActive = claromentisStatus?.status?.status === "active";

  const inactiveSources: SourceSlot[] = INTEGRATION_DEFINITIONS.filter((d) => {
    if (d.visibleTo === "admin" && user?.user?.role !== "admin") return false;
    if (d.key === "claromentis") return !claromentisActive;
    if (d.key === "google-drive-personal") return !personalDriveStatus?.connected;
    if (d.key === "google-drive-agency") return !agencyDriveStatus?.connected;
    return false;
  }).map((d) => {
    let connected = false;
    let connectHref: string | undefined;
    if (d.key === "claromentis") {
      connected = claromentisActive;
      connectHref = "/dashboard/settings/integrations";
    }
    if (d.key === "google-drive-personal") {
      connected = personalDriveStatus?.connected ?? false;
      connectHref = "/dashboard/settings/integrations";
    }
    if (d.key === "google-drive-agency") {
      connected = agencyDriveStatus?.connected ?? false;
      connectHref = "/dashboard/settings/integrations";
    }
    const descriptions: Record<string, string> = {
      claromentis: "Your intranet knowledge base for policies and content.",
      "google-drive-personal": "Your personal Google Drive documents and PDFs.",
      "google-drive-agency": "Shared agency Google Drive for team content.",
    };
    return {
      key: d.key,
      label: d.label,
      description: descriptions[d.key] ?? "Connect this source for better answers.",
      connected,
      connectHref,
    };
  });

  const notYetConnected = inactiveSources.filter((s) => !s.connected && !skippedKeys.has(s.key));
  const currentSource = notYetConnected[currentSourceIndex];

  const handleContinue = useCallback(() => {
    if (notYetConnected.length === 0) {
      setScreen("ingestion-demo");
      return;
    }
    setScreen("connect");
    setCurrentSourceIndex(0);
  }, [notYetConnected.length]);

  const handleSkipSetup = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  }, [onComplete]);

  const handleSkipSource = useCallback(() => {
    if (currentSource) setSkippedKeys((prev) => new Set(prev).add(currentSource.key));
    if (currentSourceIndex >= notYetConnected.length - 1) {
      setScreen("ingestion-demo");
    } else {
      setCurrentSourceIndex((i) => i + 1);
    }
  }, [currentSource, currentSourceIndex, notYetConnected.length]);

  const handleConnectLater = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  }, [onComplete]);

  const handleStartChatting = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  }, [onComplete]);

  // Screen 1 — Overview
  if (screen === "overview") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Connect your knowledge sources
            </h1>
            <p className="text-base text-muted-foreground">
              TravelLustre&apos;s answers are only as good as the sources behind them. Let&apos;s set yours up.
            </p>
          </div>
          <div className="space-y-3 mb-8">
            {inactiveSources.map((src) => (
              <div
                key={src.key}
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{src.label}</p>
                    <p className="text-sm text-muted-foreground/75 truncate">{src.description}</p>
                  </div>
                </div>
                {src.connectHref ? (
                  <Link href={src.connectHref} className="shrink-0">
                    <Button size="sm" variant="outline" className="border-white/20">
                      Connect
                    </Button>
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Coming soon</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleContinue} className="w-full bg-brand-chat-user hover:bg-[#C4975E]">
              Continue →
            </Button>
            <button
              type="button"
              onClick={handleSkipSetup}
              className="text-compact text-muted-foreground/75 hover:text-foreground underline"
            >
              Skip setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2 — Per-source (one screen per inactive source)
  if (screen === "connect" && currentSource) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
        <div className="max-w-md w-full">
          <p className="text-sm text-muted-foreground/75 mb-4">
            Source {currentSourceIndex + 1} of {notYetConnected.length}
          </p>
          <div className="p-6 rounded-2xl bg-card border border-input mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                <Database className="w-6 h-6 text-[#AE8550]" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{currentSource.label}</h2>
            </div>
            <p className="text-base text-muted-foreground mb-6">{currentSource.description}</p>
            {currentSource.connectHref ? (
              <div className="flex flex-col gap-2">
                <Link href={currentSource.connectHref} className="block" onClick={() => setConnectedKeys((s) => new Set(s).add(currentSource.key))}>
                  <Button className="w-full bg-brand-chat-user hover:bg-[#C4975E]">
                    Connect {currentSource.label}
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={handleSkipSource}
                  className="text-compact text-muted-foreground/75 hover:text-foreground underline"
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <>
                {/* TODO: wire OAuth */}
                <Button disabled className="w-full opacity-60">Coming soon</Button>
                <button type="button" onClick={handleSkipSource} className="mt-2 text-compact text-muted-foreground/75 hover:text-foreground underline">
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen 3 — Data Ingestion Demo
  if (screen === "ingestion-demo") {
    return (
      <DataIngestionDemo
        onComplete={() => setScreen("confirmation")}
        onSkip={() => setScreen("confirmation")}
      />
    );
  }

  // Screen 4 — Confirmation
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-semibold text-foreground mb-2 text-center">You&apos;re all set</h1>
        <p className="text-base text-muted-foreground mb-6 text-center">
          Start asking questions — you can connect more sources anytime in Settings.
        </p>
        <div className="space-y-2 mb-8">
          {inactiveSources.filter((s) => s.connected).map((s) => (
            <div key={s.key} className="flex items-center gap-3 p-3 rounded-lg bg-card">
              <Check className="w-5 h-5 text-[#7AC889] shrink-0" />
              <span className="text-base text-foreground">{s.label}</span>
            </div>
          ))}
          {inactiveSources.filter((s) => !s.connected).map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card/60">
              <span className="text-base text-muted-foreground">{s.label}</span>
              <Link href="/dashboard/settings/integrations" className="text-sm text-[#AE8550] hover:underline">
                Connect later
              </Link>
            </div>
          ))}
        </div>
        <Button onClick={handleStartChatting} className="w-full bg-brand-chat-user hover:bg-[#C4975E] text-white">
          Start chatting →
        </Button>
      </div>
    </div>
  );
}
