import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.igdb.com" },
    ],
  },
  agentRules: false,
};

export default nextConfig;
