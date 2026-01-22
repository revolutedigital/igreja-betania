import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

// Configuração do Sentry
const sentryConfig = {
  // Silencia logs do Sentry durante build
  silent: true,

  // Upload de source maps para melhor debugging
  widenClientFileUpload: true,

  // Esconde source maps em produção
  hideSourceMaps: true,

  // Desabilita logger do Sentry
  disableLogger: true,

  // Habilita tree shaking automático
  automaticVercelMonitors: true,
};

// Exporta com ou sem Sentry baseado na variável de ambiente
export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
