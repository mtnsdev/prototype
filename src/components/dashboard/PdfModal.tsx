"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { backendUrl } from "@/lib/claromentis/backendApi";

interface PdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    filename: string;
    pageNumber: number | string;
    pdfPath?: string;
}

// Function to get PDF preview URL from filename and page number
function getPdfPreviewUrlFromFilename(filename: string, pageNumber: number | string, pdfPath?: string): string {
    // Extract filename from pdf_path if it's a full path, otherwise use filename
    
    
    // Build the PDF preview URL with page parameter
    const baseUrl = backendUrl(`/api/document/pdf/${encodeURIComponent(filename)}`);
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(pageNumber));
    
    return url.toString();
}

export default function PdfModal({ isOpen, onClose, filename, pageNumber, pdfPath }: PdfModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Build PDF URL with page parameter and hash for direct navigation
    const pdfUrl = isOpen 
        ? `${getPdfPreviewUrlFromFilename(filename, pageNumber, pdfPath)}#page=${pageNumber}`
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                            {filename}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Page {pageNumber}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden">
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
