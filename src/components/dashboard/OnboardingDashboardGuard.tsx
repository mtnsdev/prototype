"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  POST_ONBOARDING_CHAT_PATH,
  shouldShowOnboarding,
  storePostOnboardingRedirect,
} from "@/lib/onboardingState";

/**
 * Sends users with incomplete onboarding to /dashboard/onboarding from any dashboard route
 * (covers auth bypass on /login → /dashboard/products and direct visits to /).
 */
export function OnboardingDashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (pathname?.startsWith("/dashboard/onboarding")) return;
    if (!shouldShowOnboarding(user)) return;
    storePostOnboardingRedirect(POST_ONBOARDING_CHAT_PATH);
    router.replace("/dashboard/onboarding");
  }, [user, isLoading, pathname, router]);

  return <>{children}</>;
}
