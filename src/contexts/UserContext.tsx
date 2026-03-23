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
    /** Demo toggle: Knowledge Vault admin UI (scope dropdown, Show all, delete, re-index). Default off = advisor. */
    kvViewAsAdmin: boolean;
    setKvViewAsAdmin: (value: boolean) => void;
};

const UserContext = createContext<UserContextType | null>(null);

const USER_STORAGE_KEY = "user_data";

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [kvViewAsAdmin, setKvViewAsAdmin] = useState(false);

    // Hydrate user from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(USER_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setUserState(parsed);
            }
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

    const clearUser = useCallback(() => {
        setUserState(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem("auth_token");
        // Keep cookie in sync with local logout
        document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
    }, []);

    const getFirstName = useCallback((): string => {
        if (!user) return "there";

        // Try to get first name from username (e.g., "John Doe" -> "John")
        if (user.username) {
            const firstName = user.username.split(" ")[0].trim();
            if (firstName) return firstName;
        }

        // Fallback to email prefix
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
                kvViewAsAdmin,
                setKvViewAsAdmin,
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

// Optional hook that returns null instead of throwing if used outside provider
export function useUserOptional() {
    return useContext(UserContext);
}
