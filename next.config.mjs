import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  /** Parent folder has its own lockfile; pin Turbopack to this app. */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
