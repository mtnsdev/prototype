"use client";

import { MOCK_PROTOTYPE_USERS, useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

/**
 * Prototype-only: same permission flip as Sidebar → Admin view — toggles `user.role`
 * between admin and advisor (preserves logged-in identity). Seeds a demo user only
 * if none is logged in.
 */
export function DirectoryRoleToggle({ className }: { className?: string }) {
  const { user, setUser, setPrototypeAdminView } = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <button
      type="button"
      onClick={() => {
        if (user) {
          setPrototypeAdminView(!isAdmin);
        } else {
          setUser({ ...MOCK_PROTOTYPE_USERS.admin });
        }
      }}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-popover/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:text-foreground",
        className
      )}
      title="Prototype: same as Sidebar Admin view — switch advisor vs admin permissions"
    >
      <span aria-hidden>👤</span>
      <span className="min-w-0 truncate">{isAdmin ? "Admin" : "Advisor"}</span>
    </button>
  );
}
