export type AppEnv = "production" | "preview" | "local"

export type PlatformName =
  | "vercel"
  | "netlify"
  | "cloudflare"
  | "railway"
  | "fly"
  | "render"
  | "digitalocean"
  | "heroku"

export type Platform = PlatformName | null

export interface WhichUrl {
  /** Full URL including protocol — `"https://myapp.com"` */
  readonly href: string
  /** Full origin — `"https://myapp.com"` (same as href) */
  readonly origin: string
  /** Hostname without port — `"myapp.com"` */
  readonly hostname: string
  /** Hostname with port — `"myapp.com"` or `"localhost:3000"` */
  readonly host: string
  /** Protocol with colon — `"https:"` or `"http:"` */
  readonly protocol: string
  /** Port string — `""` for default ports, `"3000"` for custom */
  readonly port: string
  /** Current environment — `"production"`, `"preview"`, or `"local"` */
  readonly env: AppEnv
  /** Detected hosting platform — `"vercel"`, `"netlify"`, etc. or `null` */
  readonly platform: Platform
  /** `true` when running in production */
  readonly isProduction: boolean
  /** `true` when running in a preview/staging deployment */
  readonly isPreview: boolean
  /** `true` when running locally (development) */
  readonly isLocal: boolean
}

export interface WhichUrlWithDebug extends WhichUrl {
  /** Resolution debug string (non-enumerable — excluded from JSON.stringify and object spread). */
  readonly debug: string
}

export interface ProviderDetector {
  name: PlatformName
  detect: (env: Record<string, string | undefined>) => boolean
  resolveUrl: (env: Record<string, string | undefined>) => string | null
  resolveEnv: (env: Record<string, string | undefined>) => AppEnv
}
