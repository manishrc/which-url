export type AppEnv = "production" | "preview" | "local"

export type Platform =
  | "vercel"
  | "netlify"
  | "cloudflare"
  | "railway"
  | "fly"
  | "render"
  | "digitalocean"
  | "heroku"
  | null

export interface WhichUrl {
  href: string
  origin: string
  hostname: string
  host: string
  protocol: string
  port: string
  env: AppEnv
  platform: Platform
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
