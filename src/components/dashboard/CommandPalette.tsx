"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUserOptional } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { DASHBOARD_COMMANDS, filterDashboardCommands, type DashboardCommand } from "@/lib/dashboardCommands";

export default function CommandPalette() {
    const router = useRouter();
    const userContext = useUserOptional();
    const opsLens = userContext?.prototypeAdminView ?? false;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAppleOS, setIsAppleOS] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsAppleOS(
            typeof navigator !== "undefined" &&
                (/Mac|iPhone|iPod|iPad/i.test(navigator.platform) || navigator.userAgent.includes("Mac")),
        );
    }, []);

    const filtered = useMemo(
        () => filterDashboardCommands(DASHBOARD_COMMANDS, { opsLens, query }),
        [opsLens, query],
    );

    const grouped = useMemo(() => {
        const goTo = filtered.filter((c) => c.group === "Go to");
        const ops = filtered.filter((c) => c.group === "Agency ops");
        const flat: DashboardCommand[] = [...goTo, ...ops];
        return { flat, goTo, ops };
    }, [filtered]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query, opsLens]);

    useEffect(() => {
        if (open) {
            const t = requestAnimationFrame(() => inputRef.current?.focus());
            return () => cancelAnimationFrame(t);
        }
        setQuery("");
        return undefined;
    }, [open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const runCommand = useCallback(
        (c: DashboardCommand) => {
            router.push(c.href);
            setOpen(false);
            setQuery("");
        },
        [router],
    );

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, Math.max(0, grouped.flat.length - 1)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(0, i - 1));
        } else if (e.key === "Enter" && grouped.flat[activeIndex]) {
            e.preventDefault();
            runCommand(grouped.flat[activeIndex]);
        }
    };

    const renderGroup = (title: string, items: DashboardCommand[], offset: number) => {
        if (items.length === 0) return null;
        return (
            <div className="px-2 pb-2">
                <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {title}
                </p>
                <ul className="space-y-0.5" role="listbox" aria-label={title}>
                    {items.map((c, i) => {
                        const globalIdx = offset + i;
                        const selected = globalIdx === activeIndex;
                        return (
                            <li key={c.id} role="option" aria-selected={selected}>
                                <button
                                    type="button"
                                    className={cn(
                                        "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                        selected
                                            ? "bg-muted/60 text-foreground"
                                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                    )}
                                    onClick={() => runCommand(c)}
                                    onMouseEnter={() => setActiveIndex(globalIdx)}
                                >
                                    <span className="truncate">{c.label}</span>
                                    {c.opsOnly ? (
                                        <span className="ml-auto shrink-0 rounded-md border border-border px-1.5 py-0.5 text-2xs text-muted-foreground/80">
                                            Ops
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    const goToOffset = 0;
    const opsOffset = grouped.goTo.length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                overlayClassName="z-[95]"
                showCloseButton={false}
                className={cn(
                    "fixed left-[50%] top-[12vh] z-[100] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-0 gap-0 overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl outline-none",
                    "sm:max-w-lg",
                    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                )}
                onKeyDown={onKeyDown}
            >
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                    <Search className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search pages and actions…"
                        className="h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                        aria-label="Search commands"
                        autoComplete="off"
                    />
                </div>
                <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
                    {grouped.flat.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No matches</p>
                    ) : (
                        <>
                            {renderGroup("Go to", grouped.goTo, goToOffset)}
                            {renderGroup("Agency ops", grouped.ops, opsOffset)}
                        </>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-2xs text-muted-foreground/70">
                    <span>
                        <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">↑</kbd>{" "}
                        <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">↓</kbd> navigate
                    </span>
                    <span>
                        <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">↵</kbd> open
                    </span>
                    <span>
                        <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">Esc</kbd> close
                    </span>
                    <span className="ml-auto">
                        {isAppleOS ? (
                            <>
                                <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">⌘</kbd>
                                <kbd className="ml-0.5 rounded border border-border bg-muted/30 px-1 font-mono">K</kbd>
                            </>
                        ) : (
                            <>
                                <kbd className="rounded border border-border bg-muted/30 px-1 font-mono">Ctrl</kbd>
                                <kbd className="ml-0.5 rounded border border-border bg-muted/30 px-1 font-mono">K</kbd>
                            </>
                        )}
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
