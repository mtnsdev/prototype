"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { AUTH_BYPASS_TOKEN, isAuthBypassEnabled } from "@/lib/authBypass";

export type User = {
    id: number;
    email: string;
    username: string;
    agency_id?: string | null;
    role: string;
    status: string;
    has_password?: boolean;
    /** When false, hides commission surfaces (prototype team policy). Default: visible. */
    canViewCommissions?: boolean;
};

/** Prototype personas — optional seed when no user is logged in. */
export const MOCK_PROTOTYPE_USERS = {
    admin: {
        id: 1,
        username: "Kristin",
        email: "kristin@travellustre.com",
        role: "admin",
        status: "active",
        agency_id: "tl-demo",
    },
    advisor: {
        id: 2,
        username: "Denise",
        email: "denise@travellustre.com",
        role: "advisor",
        status: "active",
        agency_id: "tl-demo",
    },
} as const satisfies Record<string, User>;

type UserContextType = {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    getFirstName: () => string;
    /**
     * Derived from `user.role === "admin"`. Same as `usePermissions().isAdmin` for the prototype.
     * Sidebar and directory toggles update `user.role` — one source of truth.
     */
    prototypeAdminView: boolean;
    /** Sets `user.role` to admin or advisor (persists with `user_data`). No-op if `user` is null. */
    setPrototypeAdminView: (value: boolean) => void;
};

const UserContext = createContext<UserContextType | null>(null);

const USER_STORAGE_KEY = "user_data";
const PROTOTYPE_ADMIN_KEY = "enable_prototype_admin_view";
/** Legacy keys — read once for migration into `user.role`, then cleared */
const LEGACY_KV_KEY = "enable_kv_admin_demo";
const LEGACY_DIR_KEY = "enable_directory_admin_demo";
const LEGACY_BRIEFING_ADVISOR_KEY = "enable_briefing_preview_advisor";

function readLegacyPrototypeAdminPreference(): boolean {
    try {
        const kv = localStorage.getItem(LEGACY_KV_KEY) === "1";
        const dir = localStorage.getItem(LEGACY_DIR_KEY) === "1";
        const briefingAsAdvisor = localStorage.getItem(LEGACY_BRIEFING_ADVISOR_KEY) === "1";
        if (kv || dir) return true;
        if (briefingAsAdvisor) return false;
    } catch {
        /* ignore */
    }
    return false;
}

function clearLegacyPrototypeKeys(): void {
    try {
        localStorage.removeItem(LEGACY_KV_KEY);
        localStorage.removeItem(LEGACY_DIR_KEY);
        localStorage.removeItem(LEGACY_BRIEFING_ADVISOR_KEY);
    } catch {
        /* ignore */
    }
}

function migrateStoredUserRole(parsed: User | null): User | null {
    if (!parsed) return null;
    const hasRole = typeof parsed.role === "string" && parsed.role.trim() !== "";
    if (hasRole) return parsed;

    try {
        const proto = localStorage.getItem(PROTOTYPE_ADMIN_KEY);
        if (proto === "1") return { ...parsed, role: "admin" };
        if (proto === "0") return { ...parsed, role: "advisor" };
        if (readLegacyPrototypeAdminPreference()) return { ...parsed, role: "admin" };
        return { ...parsed, role: "advisor" };
    } catch {
        return { ...parsed, role: "advisor" };
    }
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(USER_STORAGE_KEY);
            let parsed: User | null = stored ? JSON.parse(stored) : null;
            const roleBefore = parsed?.role;
            parsed = migrateStoredUserRole(parsed);
            if (parsed && roleBefore !== parsed.role) {
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed));
            }
            try {
                localStorage.removeItem(PROTOTYPE_ADMIN_KEY);
            } catch {
                /* ignore */
            }
            clearLegacyPrototypeKeys();

            if (!parsed && isAuthBypassEnabled()) {
                parsed = { ...MOCK_PROTOTYPE_USERS.admin };
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed));
                localStorage.setItem("auth_token", AUTH_BYPASS_TOKEN);
                const secure =
                    typeof window !== "undefined" && window.location.protocol === "https:"
                        ? "; Secure"
                        : "";
                document.cookie = `auth_token=${encodeURIComponent(AUTH_BYPASS_TOKEN)}; Path=/; SameSite=Lax${secure}`;
            }

            setUserState(parsed);
        } catch (error) {
            console.error("Failed to parse stored user data:", error);
            localStorage.removeItem(USER_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setUser = useCallback((newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, []);

    const prototypeAdminView = useMemo(
        () => user?.role?.toLowerCase() === "admin",
        [user?.role]
    );

    const setPrototypeAdminView = useCallback(
        (value: boolean) => {
            setUserState((prev) => {
                if (!prev) return null;
                const next = { ...prev, role: value ? "admin" : "advisor" };
                try {
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
                } catch {
                    /* ignore */
                }
                return next;
            });
        },
        []
    );

    const clearUser = useCallback(() => {
        setUserState(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem("auth_token");
        document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
    }, []);

    const getFirstName = useCallback((): string => {
        if (!user) return "there";

        if (user.username) {
            const firstName = user.username.split(" ")[0].trim();
            if (firstName) return firstName;
        }

        if (user.email) {
            const emailPrefix = user.email.split("@")[0];
            if (emailPrefix) return emailPrefix;
        }

        return "there";
    }, [user]);

    return (
        <UserContext.Provider
            value={{
                user,
                isLoading,
                setUser,
                clearUser,
                getFirstName,
                prototypeAdminView,
                setPrototypeAdminView,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export function useUserOptional() {
    return useContext(UserContext);
}
