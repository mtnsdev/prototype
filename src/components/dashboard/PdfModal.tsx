"use client";

import { useEffect, useRef, useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    filename: string;
    pageNumber?: number | string;
    pdfPath?: string;
    /** Optional custom URL - if provided, bypasses POST fetch and uses this URL in iframe */
    customUrl?: string;
}

export default function PdfModal({ isOpen, onClose, filename, pageNumber = 1, pdfPath, customUrl }: PdfModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const objectUrlRef = useRef<string | null>(null);
    const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // When using POST API: fetch PDF with { pdf_path, page }, then show in iframe via blob URL
    useEffect(() => {
        if (!isOpen) return;

        if (customUrl) {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
            return;
        }

        if (!pdfPath && !filename) {
            queueMicrotask(() => {
                setError("No document path provided.");
                setPdfObjectUrl(null);
            });
            return;
        }

        const path = pdfPath || filename;
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        queueMicrotask(() => {
            setPdfObjectUrl(null);
            setLoading(true);
            setError(null);
        });

        const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
        fetch("/api/document/pdf", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                pdf_path: path,
                page: Number(pageNumber) || 1,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `Failed to load PDF (${res.status})`);
                }
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                objectUrlRef.current = url;
                setPdfObjectUrl(url);
            })
            .catch((err) => {
                setError(err?.message || "Failed to load PDF.");
                setPdfObjectUrl(null);
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [isOpen, pdfPath, filename, pageNumber, customUrl]);

    const iframeSrc = customUrl
        ? customUrl
        : pdfObjectUrl
            ? `${pdfObjectUrl}#page=${pageNumber}`
            : "";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                className="!fixed top-1/2 left-1/2 !w-[95vw] !max-w-[1400px] sm:!max-w-[1400px] h-[90vh] -translate-x-1/2 -translate-y-1/2 m-4 bg-[#F5F5F5] rounded-2xl shadow-2xl flex flex-col overflow-hidden p-0 border-0 z-50"
                onClick={(e) => e.stopPropagation()}
                onPointerDownOutside={onClose}
                onInteractOutside={onClose}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-[rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-[15px] font-semibold text-[#0C0C0C] truncate">
                                {filename}
                            </DialogTitle>
                            <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-0.5">
                                {customUrl ? "Document Preview" : `Page ${pageNumber}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="ml-4 w-9 h-9 bg-transparent hover:bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.5)]"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* PDF Viewer - min-h-0 allows flex item to shrink; fills remaining height */}
                <div className="flex-1 min-h-0 overflow-hidden bg-[#e5e5e5] relative flex flex-col">
                    {!customUrl && loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#e5e5e5] z-10">
                            <Loader2 className="w-10 h-10 animate-spin text-[rgba(0,0,0,0.4)]" />
                        </div>
                    )}
                    {!customUrl && error && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#e5e5e5] z-10">
                            <p className="text-[15px] text-[rgba(0,0,0,0.7)]">{error}</p>
                        </div>
                    )}
                    {iframeSrc && !error && (
                        <iframe
                            ref={iframeRef}
                            src={iframeSrc}
                            className="w-full flex-1 min-h-0 border-0 block"
                            title={`PDF Viewer - ${filename} - Page ${pageNumber}`}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}