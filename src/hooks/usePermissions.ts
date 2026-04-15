"use client";

import { useUser } from "@/contexts/UserContext";

export function usePermissions() {
  const { user } = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return {
    isAdmin,
    canViewCommissions: Boolean(user) && (isAdmin || user?.canViewCommissions !== false),
    canEditTeamData: isAdmin,
    canDeleteAnyContent: isAdmin,
    canShareCollections: isAdmin,
  };
}
