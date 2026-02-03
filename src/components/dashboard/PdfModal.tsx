"use client";

import { useEffect, useRef } from "react";
import { X, FileText } from "lucide-react";

interface PdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    filename: string;
    pageNumber?: number | string;
    pdfPath?: string;
    /** Optional custom URL - if provided, bypasses default URL construction */
    customUrl?: string;
}

// Function to get PDF preview URL from filename and page number
function getPdfPreviewUrlFromFilename(filename: string, pageNumber: number | string): string {
    // Build the PDF preview URL with page parameter
    // Use string concatenation instead of URL constructor (which requires absolute URLs)
    const baseUrl = `/api/document/pdf/${encodeURIComponent(filename)}`;
    return `${baseUrl}?page=${encodeURIComponent(String(pageNumber))}`;
}

export default function PdfModal({ isOpen, onClose, filename, pageNumber = 1, pdfPath, customUrl }: PdfModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Build PDF URL - use customUrl if provided, otherwise construct from filename
    const pdfUrl = isOpen
        ? customUrl || `${getPdfPreviewUrlFromFilename(filename, pageNumber)}#page=${pageNumber}`
        : "";

    useEffect(() => {
        if (isOpen && iframeRef.current) {
            // Reset iframe src to ensure it reloads with the new page
            const iframe = iframeRef.current;
            iframe.src = pdfUrl;
        }
    }, [isOpen, pdfUrl]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-[#F5F5F5] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)] bg-white">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-[rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-semibold text-[#0C0C0C] truncate">
                                {filename}
                            </h2>
                            <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-0.5">
                                {customUrl ? "Document Preview" : `Page ${pageNumber}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 w-9 h-9 flex items-center justify-center hover:bg-[rgba(0,0,0,0.05)] rounded-lg transition-colors duration-150"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                    </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden bg-[#e5e5e5]">
                    <iframe
                        ref={iframeRef}
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={`PDF Viewer - ${filename} - Page ${pageNumber}`}
                        style={{ minHeight: '600px' }}
                    />
                </div>
            </div>
        </div>
    );
}