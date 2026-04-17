"use client";

import { MOCK_PROTOTYPE_USERS, useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

const PROTOTYPE_ROLE_TITLE =
  "Prototype: same as Sidebar Admin view — switch advisor vs admin permissions";

/**
 * Prototype-only: same permission flip as Sidebar → Admin view — toggles `user.role`
 * between admin and advisor (preserves logged-in identity). Seeds a demo user only
 * if none is logged in.
 */
export function DirectoryRoleToggle({ className }: { className?: string }) {
  const { user, setUser, setPrototypeAdminView } = useUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const onClick = () => {
    if (user) {
      setPrototypeAdminView(!isAdmin);
    } else {
      setUser({ ...MOCK_PROTOTYPE_USERS.admin });
    }
  };

  const label = isAdmin ? "Admin" : "Advisor";
  const ariaLabel = isAdmin ? "Switch to advisor view" : "Switch to admin view";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-popover/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:text-foreground",
        className
      )}
      title={PROTOTYPE_ROLE_TITLE}
      aria-label={ariaLabel}
    >
      <span aria-hidden>👤</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
