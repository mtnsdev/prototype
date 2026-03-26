"use client";

import { useMemo } from "react";

type ProxyArgs =
    | { uri: string; filename?: string }
    | { path: string; filename?: string };

export function useProxyUrl(args: ProxyArgs | undefined) {
    return useMemo(() => {
        if (!args) return null;

        const url = new URL("/api/library/proxy", window.location.origin);

        if ("uri" in args) url.searchParams.set("uri", args.uri);
        if ("path" in args) url.searchParams.set("path", args.path);
        if (args.filename) url.searchParams.set("filename", args.filename);

        // Return relative URL so Next rewrites apply
        return url.pathname + url.search;
    }, [args]);
}
