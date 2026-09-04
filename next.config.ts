import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.igdb.com" },
    ],
    // Las imagenes de IGDB ya vienen en tamano fijo; evita el limite mensual
    // de optimizacion de imagenes de Vercel (se agota rapido en testing).
    unoptimized: true,
  },
  agentRules: false,
};

export default nextConfig;
