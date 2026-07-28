import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal self-contained Node.js server for the production
  // Docker image. Static assets are copied separately in the Dockerfile.
  output: "standalone",
};

export default nextConfig;
