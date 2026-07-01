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
  /** Canonical production origin when configured or detectable, otherwise `undefined`. */
  readonly productionOrigin: string | undefined
  /**
   * Every origin that is this app in the current environment, primary first,
   * deduped — the current origin, portless URLs (`PORTLESS_URL`,
   * `PORTLESS_TAILSCALE_URL`, `PORTLESS_NGROK_URL`), provider alias URLs
   * (e.g. Vercel deployment + branch + production domain), and
   * `http://localhost:{PORT}` in local dev. Feed it to allow-lists:
   * better-auth `trustedOrigins`, CORS, CSP.
   */
  readonly allowedOrigins: string[]
  /** Unique hostnames of `allowedOrigins` — for Next.js `allowedDevOrigins`, `images.remotePatterns`, cookie domains. */
  readonly allowedHostnames: string[]
  /** Current environment — `"production"`, `"preview"`, or `"local"` */
  readonly env: AppEnv
  /** Detected hosting platform — `"vercel"`, `"netlify"`, etc. or `null` */
  readonly platform: Platform
  /** `true` when the current URL resolved successfully; `false` only on the import-safe fallback. */
  readonly isResolved: boolean
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

export interface CreateUrlOptions {
  /**
   * Runtime environment source. Pass this when `process.env` isn't available
   * or doesn't contain your config — e.g. on Cloudflare Workers, where the
   * Worker `env` argument carries `[vars]` from `wrangler.toml`.
   *
   * When provided, `process.env` is ignored entirely. Only string-valued
   * entries participate in URL detection — non-string Workers bindings
   * (KV namespaces, Durable Objects, R2 buckets, service bindings) are dropped.
   */
  env?: object
}

export interface ProviderDetector {
  name: PlatformName
  detect: (env: Record<string, string | undefined>) => boolean
  resolveUrl: (env: Record<string, string | undefined>) => string | null
  resolveProductionUrl?: (env: Record<string, string | undefined>) => string | null
  resolveEnv: (env: Record<string, string | undefined>) => AppEnv
  /**
   * Additional URLs that are also this app in the current deployment —
   * e.g. Vercel's deployment URL and branch URL alongside the custom domain.
   * Used to build the `allowedOrigins` allow-list.
   */
  resolveAliasUrls?: (env: Record<string, string | undefined>) => string[]
}
