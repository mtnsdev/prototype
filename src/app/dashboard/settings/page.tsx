"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    User,
    LogOut,
    Mail,
    AtSign,
    Loader2,
    Shield,
    ChevronRight,
    Key,
    Plug,
    Users,
    Database,
    Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { isWorkspaceStaff } from "@/lib/workspaceRoles";

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
        clearUser();
        router.push("/dashboard");
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
            <div className="h-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/55" />
                    <span className="text-compact text-muted-foreground/75">Loading settings…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
                    <p className="text-base text-muted-foreground/75 mt-1">Manage your account preferences</p>
                </div>

                {/* Profile Section */}
                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <User size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Profile</h2>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Email */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-muted-foreground/55" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Label className="text-sm text-muted-foreground/75 uppercase tracking-wider">
                                    Email
                                </Label>
                                <p className="text-base text-foreground mt-1 truncate">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                                <AtSign size={18} className="text-muted-foreground/55" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Label className="text-sm text-muted-foreground/75 uppercase tracking-wider">
                                    Username
                                </Label>
                                <p className="text-base text-foreground mt-1 truncate">
                                    {profile?.username}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Section — only for users who registered with a password */}
                {user?.has_password && <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <Key size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Security</h2>
                    </div>

                    <div className="p-5 space-y-4">
                        <p className="text-compact text-muted-foreground/75">
                            Change your password. You will be signed out after changing your password.
                        </p>
                        
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground/75 uppercase tracking-wider">
                                Current Password
                            </Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="rounded-xl bg-background border-border"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground/75 uppercase tracking-wider">
                                New Password
                            </Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="rounded-xl bg-background border-border"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground/75 uppercase tracking-wider">
                                Confirm New Password
                            </Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="rounded-xl bg-background border-border"
                            />
                        </div>
                        
                        {passwordError && (
                            <p className="text-compact text-[var(--color-error)]">{passwordError}</p>
                        )}
                        
                        {passwordSuccess && (
                            <p className="text-compact text-green-400">Password changed successfully. Redirecting to login…</p>
                        )}
                        
                        <p className="text-sm text-muted-foreground/55">
                            Password must be at least 8 characters with at least one letter and one number.
                        </p>
                        
                        <Button
                            onClick={handlePasswordChange}
                            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className="gap-2"
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
                        </Button>
                    </div>
                </section>}

                {/* Account Section */}
                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <LogOut size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Account</h2>
                    </div>

                    <div className="p-5">
                        <p className="text-compact text-muted-foreground/75 mb-4">
                            Sign out of your account on this device.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="gap-2 bg-[rgba(200,122,122,0.12)] hover:bg-[rgba(200,122,122,0.18)] border-[rgba(200,122,122,0.2)] text-[var(--color-error)] hover:text-[#D89A9A]"
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
                        </Button>
                    </div>
                </section>

                {/* Integrations Section */}
                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <Plug size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Integrations</h2>
                    </div>
                    <div className="p-5">
                        <p className="text-compact text-muted-foreground/75 mb-4">
                            Connect Google Drive and other data sources for search.
                        </p>
                        <Link
                            href="/dashboard/settings/integrations"
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-base font-medium",
                                "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                "border border-input",
                                "text-foreground",
                                "transition-all duration-150",
                            ].join(" ")}
                        >
                            <Plug size={16} />
                            Manage Integrations
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* Briefing Room — tied to prototype Admin view */}
                <section className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/8 to-white/4 flex items-center justify-center border border-input">
                            <Newspaper size={18} className="text-muted-foreground" />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">Briefing Room</h2>
                    </div>
                    <div className="p-5">
                        <p className="text-compact text-muted-foreground/75 mb-4">
                            How user mode vs admin view affects the dashboard briefing (same toggle as the user
                            menu). On the Briefing Room, use the sliders icon on each widget card to set show,
                            column, and size. If you hide widgets, use Reset layout on the briefing page to restore
                            defaults.
                        </p>
                        <Link
                            href="/dashboard/settings/briefing-room"
                            className={[
                                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                "text-base font-medium",
                                "bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)]",
                                "border border-input",
                                "text-foreground",
                                "transition-all duration-150",
                            ].join(" ")}
                        >
                            <Newspaper size={16} />
                            Briefing Room & prototype mode
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* Admin Section - Only visible to admins */}
                {isWorkspaceStaff(user) && (
                    <section className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                                <Shield size={18} className="text-[var(--color-warning)]" />
                            </div>
                            <h2 className="text-base font-semibold text-foreground">Administration</h2>
                        </div>

                        <div className="p-5 space-y-3">
                            <p className="text-compact text-muted-foreground/75">
                                Teams, knowledge source defaults, and workspace admin.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/dashboard/settings/teams"
                                    className={[
                                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                        "text-base font-medium",
                                        "bg-white/[0.06] hover:bg-white/[0.1]",
                                        "border border-border",
                                        "text-foreground",
                                        "transition-all duration-150",
                                    ].join(" ")}
                                >
                                    <Users size={16} className="text-violet-400" />
                                    Teams
                                    <ChevronRight size={16} className="ml-auto opacity-60" />
                                </Link>
                                <Link
                                    href="/dashboard/settings/rep-firms"
                                    className={[
                                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                        "text-[14px] font-medium",
                                        "bg-white/[0.06] hover:bg-white/[0.1]",
                                        "border border-white/[0.08]",
                                        "text-[#F5F5F5]",
                                        "transition-all duration-150",
                                    ].join(" ")}
                                >
                                    <Users size={16} className="text-[#B07A5B]" />
                                    Rep Firms
                                    <ChevronRight size={16} className="ml-auto opacity-60" />
                                </Link>
                                <Link
                                    href="/dashboard/settings/sources"
                                    className={[
                                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                        "text-base font-medium",
                                        "bg-white/[0.06] hover:bg-white/[0.1]",
                                        "border border-border",
                                        "text-foreground",
                                        "transition-all duration-150",
                                    ].join(" ")}
                                >
                                    <Database size={16} className="text-blue-400" />
                                    Knowledge sources
                                    <ChevronRight size={16} className="ml-auto opacity-60" />
                                </Link>
                                <Link
                                    href="/dashboard/settings/admin"
                                    className={[
                                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl",
                                        "text-base font-medium",
                                        "bg-[rgba(251,191,36,0.12)] hover:bg-[rgba(251,191,36,0.18)]",
                                        "border border-[rgba(251,191,36,0.2)] hover:border-[rgba(251,191,36,0.35)]",
                                        "text-[var(--color-warning)] hover:text-amber-300",
                                        "transition-all duration-150",
                                    ].join(" ")}
                                >
                                    <Shield size={16} />
                                    Open Admin Panel
                                    <ChevronRight size={16} className="ml-auto opacity-80" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
