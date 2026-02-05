"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldX, Mail, ArrowLeft, UserX, Clock } from "lucide-react";

export default function AccessDeniedPage() {
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason");

    const getReasonContent = () => {
        switch (reason) {
            case "disabled":
                return {
                    icon: UserX,
                    title: "Account Disabled",
                    description: "Your account has been disabled by an administrator. If you believe this is a mistake, please contact your administrator.",
                    iconColor: "text-red-400",
                    bgColor: "from-red-500/20 to-red-600/10",
                    borderColor: "border-red-500/20",
                };
            case "session_expired":
                return {
                    icon: Clock,
                    title: "Session Expired",
                    description: "Your session has expired. Please sign in again to continue.",
                    iconColor: "text-amber-400",
                    bgColor: "from-amber-500/20 to-amber-600/10",
                    borderColor: "border-amber-500/20",
                };
            default:
                return {
                    icon: ShieldX,
                    title: "Access Denied",
                    description: "You don't have access to this application. This is an invite-only system. If you need access, please contact an administrator.",
                    iconColor: "text-[rgba(245,245,245,0.6)]",
                    bgColor: "from-white/8 to-white/4",
                    borderColor: "border-white/10",
                };
        }
    };

    const content = getReasonContent();
    const Icon = content.icon;

    return (
        <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${content.bgColor} flex items-center justify-center border ${content.borderColor}`}
                    >
                        <Icon size={40} className={content.iconColor} />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight mb-3">
                        {content.title}
                    </h1>
                    <p className="text-[15px] text-[rgba(245,245,245,0.5)] leading-relaxed">
                        {content.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] text-[14px] font-medium text-[#F5F5F5] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </Link>

                    {reason !== "session_expired" && (
                        <a
                            href="mailto:admin@example.com"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-transparent hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[14px] font-medium text-[rgba(245,245,245,0.6)] transition-colors"
                        >
                            <Mail size={16} />
                            Contact Administrator
                        </a>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[12px] text-[rgba(245,245,245,0.3)] mt-8">
                    This is an invite-only application. Access is restricted to authorized users.
                </p>
            </div>
        </div>
    );
}
