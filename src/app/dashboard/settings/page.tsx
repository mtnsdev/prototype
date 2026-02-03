"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Mail, AtSign, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

type UserProfile = {
    email: string;
    username: string;
};

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading, clearUser } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("auth_token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Wait for user context to load
        if (!isUserLoading) {
            if (user) {
                setProfile({
                    email: user.email || "user@example.com",
                    username: user.username || user.email?.split("@")[0] || "User",
                });
            } else {
                // Fallback: try to load from localStorage directly
                try {
                    const storedUser = localStorage.getItem("user_data");
                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        setProfile({
                            email: parsedUser.email || "user@example.com",
                            username: parsedUser.username || parsedUser.email?.split("@")[0] || "User",
                        });
                    } else {
                        setProfile({
                            email: "user@example.com",
                            username: "User",
                        });
                    }
                } catch {
                    setProfile({
                        email: "user@example.com",
                        username: "User",
                    });
                }
            }
            setIsLoading(false);
        }
    }, [user, isUserLoading, router]);

    const handleSignOut = () => {
        setIsSigningOut(true);
        // Local-only logout - clear user data and token
        clearUser();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0C0C0C]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[rgba(245,245,245,0.4)]" />
                    <span className="text-[13px] text-[rgba(245,245,245,0.5)]">Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-[#0C0C0C]">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Settings</h1>
                    <p className="text-[14px] text-[rgba(245,245,245,0.5)] mt-1">Manage your account preferences</p>
                </div>

                {/* Profile Section */}
                <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <User size={18} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Profile</h2>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Email */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-[rgba(245,245,245,0.4)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Email
                                </label>
                                <p className="text-[15px] text-[#F5F5F5] mt-1 truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                                <AtSign size={18} className="text-[rgba(245,245,245,0.4)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider">
                                    Username
                                </label>
                                <p className="text-[15px] text-[#F5F5F5] mt-1 truncate">
                                    {profile?.username}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <LogOut size={18} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Account</h2>
                    </div>

                    <div className="p-5">
                        <p className="text-[13px] text-[rgba(245,245,245,0.5)] mb-4">
                            Sign out of your account on this device.
                        </p>
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-[14px] font-medium",
                                "bg-[rgba(200,122,122,0.12)] hover:bg-[rgba(200,122,122,0.18)]",
                                "border border-[rgba(200,122,122,0.2)] hover:border-[rgba(200,122,122,0.35)]",
                                "text-[#C87A7A] hover:text-[#D89A9A]",
                                "transition-all duration-150",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                        >
                            {isSigningOut ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing out...
                                </>
                            ) : (
                                <>
                                    <LogOut size={16} />
                                    Sign Out
                                </>
                            )}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
