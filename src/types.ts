export type AppEnv = "production" | "preview" | "local"

export interface WhichUrl {
  appUrl: string
  href: string
  origin: string
  hostname: string
  host: string
  protocol: string
  port: string
  env: AppEnv
  isProduction: boolean
  isPreview: boolean
  isLocal: boolean
}

export interface CreateUrlOptions {
  fallback?: string
}

export interface ProviderDetector {
  name: string
  detect: (env: Record<string, string | undefined>) => boolean
  resolveUrl: (env: Record<string, string | undefined>) => string | null
  resolveEnv: (env: Record<string, string | undefined>) => AppEnv
}
