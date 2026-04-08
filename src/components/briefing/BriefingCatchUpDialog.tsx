"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getBriefingCatchUpSeed, type BriefingCatchUpItem } from "@/lib/briefingCatchUpSeed";
type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function BriefingCatchUpDialog({ open, onOpenChange }: Props) {
    const items = useMemo(() => getBriefingCatchUpSeed(), []);
    const [index, setIndex] = useState(0);

    const current: BriefingCatchUpItem | undefined = items[index];
    const isLast = index >= items.length - 1;
    const progress = items.length > 0 ? ((index + 1) / items.length) * 100 : 0;

    const handleClose = useCallback(() => {
        onOpenChange(false);
        setTimeout(() => setIndex(0), 300);
    }, [onOpenChange]);

    const advance = useCallback(() => {
        if (isLast) handleClose();
        else setIndex((i) => i + 1);
    }, [isLast, handleClose]);

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) handleClose();
                else onOpenChange(true);
            }}
        >
            <DialogContent
                showCloseButton
                className="max-w-md border-border bg-background p-0 gap-0 overflow-hidden sm:max-w-md"
            >
                {current ? (
                    <>
                        <div className="h-1 w-full bg-muted/30">
                            <div
                                className="h-full bg-primary transition-[width] duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <DialogHeader className="px-6 pt-6 pb-2 text-left space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                <Sparkles className="size-3.5 text-primary" aria-hidden />
                                <span>Catch up</span>
                                <span className="text-muted-foreground/50">·</span>
                                <span>{current.classLabel}</span>
                            </div>
                            <DialogTitle className="text-lg leading-snug pr-8">{current.title}</DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                                {current.summary}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
                            {current.primaryActionHref ? (
                                <Button variant="cta" asChild className="w-full justify-center gap-2">
                                    <Link href={current.primaryActionHref} onClick={() => handleClose()}>
                                        {current.primaryActionLabel}
                                        <ChevronRight className="size-4 opacity-90" aria-hidden />
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="cta"
                                    className="w-full justify-center gap-2"
                                    onClick={advance}
                                >
                                    {current.primaryActionLabel}
                                    <ChevronRight className="size-4 opacity-90" aria-hidden />
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={advance}
                            >
                                {isLast ? "Done" : "Skip for now"}
                            </Button>
                            <p className="text-center text-2xs text-muted-foreground/60">
                                {index + 1} of {items.length}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="p-6">
                        <DialogTitle className="sr-only">Catch up</DialogTitle>
                        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
                        <Button type="button" className="mt-4" onClick={() => handleClose()}>
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
