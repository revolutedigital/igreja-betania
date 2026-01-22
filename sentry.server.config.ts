import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Ajusta taxa de amostragem para produção
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug apenas em desenvolvimento
  debug: process.env.NODE_ENV === 'development',

  // Ignora erros comuns
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],

  // Ambiente
  environment: process.env.NODE_ENV,

  // Release
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
})
