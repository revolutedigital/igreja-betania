import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes externos do servidor (movido de experimental)
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'sharp',
    'jimp',
    'pino',
    '@hapi/boom',
  ],
  // Usar Turbopack (padrão no Next.js 16)
  turbopack: {},
};

export default nextConfig;
