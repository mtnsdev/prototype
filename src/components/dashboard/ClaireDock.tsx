"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    MessageSquare,
    X,
    Maximize2,
    Minimize2,
    Plus,
    History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/contexts/ChatContext";
import ChatPanel from "@/components/dashboard/ChatPanel";
import HistoryDrawer from "@/components/dashboard/HistoryDrawer";
import { cn } from "@/lib/utils";

function ClaireDockSearchParamsSync({
    onOpenFromQuery,
}: {
    onOpenFromQuery: () => void;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (searchParams.get("claire") !== "1") return;
        onOpenFromQuery();
        const next = new URLSearchParams(searchParams.toString());
        next.delete("claire");
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [searchParams, pathname, router, onOpenFromQuery]);

    return null;
}

export default function ClaireDock() {
    const pathname = usePathname();
    const {
        selectedConversationId,
        setSelectedConversationId,
        isHistoryOpen,
        openHistory,
        closeHistory,
        triggerRefresh,
        claireOpen,
        claireFullscreen,
        openClaire,
        closeClaire,
        toggleClaireFullscreen,
        startNewClaireConversation,
    } = useChatContext();

    const isClaireHubRoute = pathname.startsWith("/dashboard/chat");
    const showFab = !isClaireHubRoute;

    const handleConversationCreated = (id: number) => {
        setSelectedConversationId(id);
        triggerRefresh();
    };

    const handleSelectConversation = (id: number) => {
        setSelectedConversationId(id);
    };

    const handleBackToHome = () => {
        setSelectedConversationId(null);
    };

    return (
        <>
            <Suspense fallback={null}>
                <ClaireDockSearchParamsSync onOpenFromQuery={openClaire} />
            </Suspense>

            {showFab && (
                <Button
                    type="button"
                    size="icon"
                    onClick={() => openClaire()}
                    className={cn(
                        "fixed bottom-6 right-6 z-[70] h-14 w-14 rounded-full shadow-lg",
                        "border border-border bg-primary text-primary-foreground",
                        "hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    aria-label="Open Claire — Enable VICs AI"
                    title="Claire — Enable VICs AI"
                >
                    <MessageSquare className="h-6 w-6" aria-hidden />
                </Button>
            )}

            {claireOpen && (
                <div
                    className={cn(
                        "fixed z-[70] flex flex-col overflow-hidden border border-border bg-background shadow-2xl",
                        claireFullscreen
                            ? "inset-0 rounded-none md:inset-4 md:rounded-2xl"
                            : "bottom-6 right-6 max-h-[min(720px,85dvh)] w-[min(440px,calc(100vw-1.5rem))] rounded-2xl",
                    )}
                    role="dialog"
                    aria-label="Claire assistant"
                >
                    <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">Claire</p>
                            <p className="truncate text-2xs text-muted-foreground/75">Enable VICs AI</p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={startNewClaireConversation}
                            aria-label="New conversation"
                            title="New conversation"
                        >
                            <Plus className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={openHistory}
                            aria-label="Conversation history"
                            title="History"
                        >
                            <History className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={toggleClaireFullscreen}
                            aria-label={claireFullscreen ? "Exit full screen" : "Full screen"}
                            title={claireFullscreen ? "Exit full screen" : "Full screen"}
                        >
                            {claireFullscreen ? (
                                <Minimize2 className="h-4 w-4" aria-hidden />
                            ) : (
                                <Maximize2 className="h-4 w-4" aria-hidden />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={closeClaire}
                            aria-label="Close Claire"
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                        <ChatPanel
                            conversationId={selectedConversationId}
                            onConversationCreated={handleConversationCreated}
                            onBackToHome={handleBackToHome}
                            assistantName="Claire"
                            assistantSubtitle="Enable VICs AI"
                        />
                    </div>

                    <HistoryDrawer
                        isOpen={isHistoryOpen}
                        onClose={closeHistory}
                        onSelectConversation={handleSelectConversation}
                        selectedConversationId={selectedConversationId}
                        stackClassNames={{
                            backdrop: "z-[75]",
                            panel: "z-[80]",
                        }}
                    />
                </div>
            )}
        </>
    );
}
