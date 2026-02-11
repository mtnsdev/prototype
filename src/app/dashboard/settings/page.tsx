"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Mail, AtSign, Loader2, Shield, ChevronRight, Key, Plug } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

type UserProfile = {
    email: string;
    username: string;
};

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, error: "Password must contain at least one letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: "Password must contain at least one number" };
    }
    return { valid: true };
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading, clearUser } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

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

    const handlePasswordChange = async () => {
        setPasswordError(null);
        setPasswordSuccess(false);
        
        // Validate current password is provided
        if (!currentPassword) {
            setPasswordError("Current password is required");
            return;
        }
        
        // Validate new passwords match
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }
        
        // Validate password policy
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            setPasswordError(validation.error || "Invalid password");
            return;
        }
        
        setIsChangingPassword(true);
        
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch("/api/auth/me/password", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to change password");
            }
            
            // Clear form and show success
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordSuccess(true);
            
            // After password change, require re-login
            setTimeout(() => {
                clearUser();
                router.push("/login?message=password_changed");
            }, 2000);
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : "Failed to change password");
        } finally {
            setIsChangingPassword(false);
        }
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

                {/* Security Section */}
                <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <Key size={18} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Security</h2>
                    </div>

                    <div className="p-5 space-y-4">
                        <p className="text-[13px] text-[rgba(245,245,245,0.5)]">
                            Change your password. You will be signed out after changing your password.
                        </p>
                        
                        <div>
                            <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[12px] font-medium text-[rgba(245,245,245,0.45)] uppercase tracking-wider mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#0C0C0C] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#F5F5F5] placeholder:text-[rgba(245,245,245,0.4)] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
                            />
                        </div>
                        
                        {passwordError && (
                            <p className="text-[13px] text-[#C87A7A]">{passwordError}</p>
                        )}
                        
                        {passwordSuccess && (
                            <p className="text-[13px] text-green-400">Password changed successfully. Redirecting to login...</p>
                        )}
                        
                        <p className="text-[12px] text-[rgba(245,245,245,0.4)]">
                            Password must be at least 8 characters with at least one letter and one number.
                        </p>
                        
                        <button
                            onClick={handlePasswordChange}
                            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-[14px] font-medium",
                                "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                "border border-[rgba(255,255,255,0.1)]",
                                "text-[#F5F5F5]",
                                "transition-all duration-150",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                            ].join(" ")}
                        >
                            {isChangingPassword ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Changing Password...
                                </>
                            ) : (
                                <>
                                    <Key size={16} />
                                    Change Password
                                </>
                            )}
                        </button>
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

                {/* Integrations Section */}
                <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-white/10">
                            <Plug size={18} className="text-[rgba(245,245,245,0.6)]" />
                        </div>
                        <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Integrations</h2>
                    </div>
                    <div className="p-5">
                        <p className="text-[13px] text-[rgba(245,245,245,0.5)] mb-4">
                            Connect Google Drive and other data sources for search.
                        </p>
                        <Link
                            href="/dashboard/settings/integrations"
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-[14px] font-medium",
                                "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                "border border-[rgba(255,255,255,0.1)]",
                                "text-[#F5F5F5]",
                                "transition-all duration-150",
                            ].join(" ")}
                        >
                            <Plug size={16} />
                            Manage Integrations
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* Admin Section - Only visible to admins */}
                {user?.role === "admin" && (
                    <section className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#161616] overflow-hidden">
                        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                                <Shield size={18} className="text-amber-400" />
                            </div>
                            <h2 className="text-[15px] font-semibold text-[#F5F5F5]">Administration</h2>
                        </div>

                        <div className="p-5">
                            <p className="text-[13px] text-[rgba(245,245,245,0.5)] mb-4">
                                Manage users and content permissions.
                            </p>
                            <Link
                                href="/dashboard/settings/admin"
                                className={[
                                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                    "text-[14px] font-medium",
                                    "bg-[rgba(251,191,36,0.12)] hover:bg-[rgba(251,191,36,0.18)]",
                                    "border border-[rgba(251,191,36,0.2)] hover:border-[rgba(251,191,36,0.35)]",
                                    "text-amber-400 hover:text-amber-300",
                                    "transition-all duration-150",
                                ].join(" ")}
                            >
                                <Shield size={16} />
                                Open Admin Panel
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
