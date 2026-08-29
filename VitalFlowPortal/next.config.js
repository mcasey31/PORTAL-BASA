/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Performance optimizations
  output: "standalone",
  productionBrowserSourceMaps: false,
  compress: true,
  
  // Reduce compilation overhead
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  
  // Better caching headers
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // Keep compiled routes warm for one hour in development.
    pagesBufferLength: 50,
  },
};

export default config;
