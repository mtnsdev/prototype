import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute app root (directory that contains `package.json` + `node_modules`). */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  /** Zod v4 + Turbopack can mis-resolve `json-schema-processors` without transpilation. */
  transpilePackages: ["zod", "leaflet", "react-leaflet"],
  /**
   * Parent `Enable Prototype/` also has `package-lock.json`. Without an explicit root,
   * Turbopack can mis-infer the workspace (e.g. treat `src/app` as the project root) and
   * fail to resolve `next/dist/...` internals. Pin to this folder only.
   */
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
