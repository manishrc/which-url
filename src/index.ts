import { resolveUrl, resolvePlatform } from "./resolve"
import { resolveEnv } from "./env"
import type { WhichUrlWithDebug, AppEnv, Platform } from "./types"

function resolve(): WhichUrlWithDebug {
  const { url, debugLabel: urlDebug } = resolveUrl()
  const parsed = new URL(url)
  const { env, debugLabel: envDebug } = resolveEnv()
  const platform = resolvePlatform()
  const debug = `${urlDebug} | env=${env} (${envDebug})`

  const result: WhichUrlWithDebug = {
    href: parsed.origin,
    origin: parsed.origin,
    hostname: parsed.hostname,
    host: parsed.host,
    protocol: parsed.protocol,
    port: parsed.port,
    env,
    platform,
    debug,
    isProduction: env === "production",
    isPreview: env === "preview",
    isLocal: env === "local",
  }

  // Make debug non-enumerable so JSON.stringify skips it.
  // Prevents React hydration mismatch when rendering the whole object
  // (server resolves via env vars, client via window.location — same URL, different debug).
  Object.defineProperty(result, "debug", {
    value: debug,
    enumerable: false,
    configurable: false,
  })

  return result
}

// Eager singleton — warn if resolution fails at import time
let _resolved: WhichUrlWithDebug
try {
  _resolved = resolve()
} catch (e) {
  console.warn(
    `[which-url] Could not detect app URL. Set APP_URL (e.g. APP_URL=https://myapp.com or APP_URL=myapp.com)`
  )
  const fallback = {
    href: "",
    origin: "",
    hostname: "",
    host: "",
    protocol: "",
    port: "",
    env: "local" as const,
    platform: null,
    debug: "[error] resolution failed",
    isProduction: false,
    isPreview: false,
    isLocal: true,
  }
  Object.defineProperty(fallback, "debug", {
    value: "[error] resolution failed",
    enumerable: false,
    configurable: false,
  })
  _resolved = fallback as WhichUrlWithDebug
}

/** Full URL including protocol — `"https://myapp.com"` */
export const href: string = _resolved.href
/** Full origin — `"https://myapp.com"` (same as href) */
export const origin: string = _resolved.origin
/** Hostname without port — `"myapp.com"` */
export const hostname: string = _resolved.hostname
/** Hostname with port — `"myapp.com"` or `"localhost:3000"` */
export const host: string = _resolved.host
/** Protocol with colon — `"https:"` or `"http:"` */
export const protocol: string = _resolved.protocol
/** Port string — `""` for default ports, `"3000"` for custom */
export const port: string = _resolved.port
/** Current environment — `"production"`, `"preview"`, or `"local"` */
export const env: AppEnv = _resolved.env
/** Detected hosting platform — `"vercel"`, `"netlify"`, etc. or `null` */
export const platform: Platform = _resolved.platform
/** `true` when running in production */
export const isProduction: boolean = _resolved.isProduction
/** `true` when running in a preview/staging deployment */
export const isPreview: boolean = _resolved.isPreview
/** `true` when running locally (development) */
export const isLocal: boolean = _resolved.isLocal

/**
 * Auto-detected app URL with environment metadata.
 *
 * @example
 * ```ts
 * import appUrl from 'which-url'
 *
 * appUrl.origin      // "https://myapp.com"
 * appUrl.env         // "production"
 * appUrl.platform    // "vercel"
 * appUrl.debug       // "[provider:vercel] url=myapp.com | env=production (vercel:production)"
 * ```
 */
export default _resolved

export type { WhichUrl, WhichUrlWithDebug, AppEnv, Platform, PlatformName } from "./types"
