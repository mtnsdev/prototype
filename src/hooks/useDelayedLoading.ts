"use client";

import { useState, useEffect, useRef } from "react";

type UseDelayedLoadingOptions = {
    /** Delay before showing loader (default: 150ms) */
    showDelay?: number;
    /** Minimum time loader stays visible once shown (default: 300ms) */
    minVisible?: number;
};

/**
 * Hook to prevent loader flickering on fast requests.
 * 
 * - Delays showing the loader by `showDelay` ms
 * - Once shown, keeps loader visible for at least `minVisible` ms
 * - Handles cleanup on unmount
 * 
 * @param isLoading - The actual loading state
 * @param options - Configuration options
 * @returns Whether to show the loader visually
 */
export function useDelayedLoading(
    isLoading: boolean,
    options?: UseDelayedLoadingOptions
): boolean {
    const { showDelay = 150, minVisible = 300 } = options ?? {};
    
    const [showLoader, setShowLoader] = useState(false);
    const showTimeRef = useRef<number | null>(null);
    const showDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hideDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear any pending hide timer when loading starts
        if (isLoading) {
            if (hideDelayTimerRef.current) {
                clearTimeout(hideDelayTimerRef.current);
                hideDelayTimerRef.current = null;
            }

            // If loader is already showing, keep it showing
            if (showLoader) {
                return;
            }

            // Start delay timer to show loader
            showDelayTimerRef.current = setTimeout(() => {
                setShowLoader(true);
                showTimeRef.current = Date.now();
            }, showDelay);
        } else {
            // Loading finished
            // Clear any pending show timer
            if (showDelayTimerRef.current) {
                clearTimeout(showDelayTimerRef.current);
                showDelayTimerRef.current = null;
            }

            // If loader is showing, ensure minimum visible time
            if (showLoader && showTimeRef.current !== null) {
                const elapsed = Date.now() - showTimeRef.current;
                const remaining = minVisible - elapsed;

                if (remaining > 0) {
                    // Wait for remaining time before hiding
                    hideDelayTimerRef.current = setTimeout(() => {
                        setShowLoader(false);
                        showTimeRef.current = null;
                    }, remaining);
                } else {
                    // Minimum time elapsed, hide immediately
                    setShowLoader(false);
                    showTimeRef.current = null;
                }
            }
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (showDelayTimerRef.current) {
                clearTimeout(showDelayTimerRef.current);
            }
            if (hideDelayTimerRef.current) {
                clearTimeout(hideDelayTimerRef.current);
            }
        };
    }, [isLoading, showDelay, minVisible, showLoader]);

    // Reset on unmount
    useEffect(() => {
        return () => {
            setShowLoader(false);
            showTimeRef.current = null;
        };
    }, []);

    return showLoader;
}
