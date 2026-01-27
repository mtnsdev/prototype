"use client";

import { backendUrl } from "@/lib/claromentis/backendApi";
import { useMemo } from "react";

type ProxyArgs =
    | { uri: string; filename?: string }
    | { path: string; filename?: string };

export function useProxyUrl(args: ProxyArgs | undefined) {
    return useMemo(() => {
        if (!args) return null;

        const url = new URL(backendUrl("/api/library/proxy"));

        if ("uri" in args) url.searchParams.set("uri", args.uri);
        if ("path" in args) url.searchParams.set("path", args.path);

        if (args.filename) url.searchParams.set("filename", args.filename);

        return url.toString();
    }, [args]);
}
