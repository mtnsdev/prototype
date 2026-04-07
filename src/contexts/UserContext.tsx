"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type User = {
    id: number;
    email: string;
    username: string;
    agency_id?: string | null;
    role: string;
    status: string;
    has_password?: boolean;
};

type UserContextType = {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    getFirstName: () => string;
    /**
     * Prototype-only: one switch for the whole app. Default off = advisor / end-user experience.
     * On = KV admin UI, directory admin UI, editable agency briefing + agency widgets.
     * Persists per device.
     */
    prototypeAdminView: boolean;
    setPrototypeAdminView: (value: boolean) => void;
};

const UserContext = createContext<UserContextType | null>(null);

const USER_STORAGE_KEY = "user_data";
const PROTOTYPE_ADMIN_KEY = "enable_prototype_admin_view";
/** Legacy keys — read once for migration, then cleared when saving prototype lens */
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

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [prototypeAdminView, setPrototypeAdminViewState] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(USER_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setUserState(parsed);
            }
            const proto = localStorage.getItem(PROTOTYPE_ADMIN_KEY);
            if (proto === "1") {
                setPrototypeAdminViewState(true);
            } else if (proto === "0") {
                setPrototypeAdminViewState(false);
            } else {
                const migrated = readLegacyPrototypeAdminPreference();
                setPrototypeAdminViewState(migrated);
                if (migrated) {
                    localStorage.setItem(PROTOTYPE_ADMIN_KEY, "1");
                } else {
                    localStorage.setItem(PROTOTYPE_ADMIN_KEY, "0");
                }
                clearLegacyPrototypeKeys();
            }
        } catch (error) {
            console.error("Failed to parse stored user data:", error);
            localStorage.removeItem(USER_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setPrototypeAdminView = useCallback((value: boolean) => {
        setPrototypeAdminViewState(value);
        try {
            localStorage.setItem(PROTOTYPE_ADMIN_KEY, value ? "1" : "0");
            clearLegacyPrototypeKeys();
        } catch {
            /* ignore */
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
