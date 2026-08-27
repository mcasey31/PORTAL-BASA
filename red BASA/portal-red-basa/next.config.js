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
    optimizePackageImports: ["@lucide-react", "date-fns"],
  },
  
  // Better caching headers
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Keep pages in memory for 60s
    pagesBufferLength: 10,
  },
};

export default config;
