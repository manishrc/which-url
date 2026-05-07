import { resolveUrl, resolvePlatform } from "./resolve"
import { resolveEnv } from "./env"
import type { WhichUrlWithDebug, AppEnv, Platform, CreateUrlOptions } from "./types"

function makeDebugNonEnumerable(result: WhichUrlWithDebug): WhichUrlWithDebug {
  Object.defineProperty(result, "debug", {
    value: result.debug,
    enumerable: false,
    configurable: false,
  })

  return result
}

export function createUrl(options?: CreateUrlOptions): WhichUrlWithDebug {
  const envOverride = options?.env
  const { url, debugLabel: urlDebug } = resolveUrl(envOverride)
  const parsed = new URL(url)
  const { env, debugLabel: envDebug } = resolveEnv(envOverride)
  const platform = resolvePlatform(envOverride)
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

  return makeDebugNonEnumerable(result)
}

function createFallback(error: unknown): WhichUrlWithDebug {
  const message = error instanceof Error ? error.message : "resolution failed"
  let resolvedEnv: AppEnv = "local"
  let envDebug = "default"

  try {
    const result = resolveEnv()
    resolvedEnv = result.env
    envDebug = result.debugLabel
  } catch {
    // Keep the fallback import-safe even if future env resolution changes.
  }

  const fallback: WhichUrlWithDebug = {
    href: "",
    origin: "",
    hostname: "",
    host: "",
    protocol: "",
    port: "",
    env: resolvedEnv,
    platform: resolvePlatform(),
    debug: `[error] ${message} | env=${resolvedEnv} (${envDebug})`,
    isProduction: resolvedEnv === "production",
    isPreview: resolvedEnv === "preview",
    isLocal: resolvedEnv === "local",
  }

  return makeDebugNonEnumerable(fallback)
}

// Eager singleton — convenient named exports should stay import-safe.
let _resolved: WhichUrlWithDebug
try {
  _resolved = createUrl()
} catch (e) {
  _resolved = createFallback(e)
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
/** Resolution debug string. */
export const debug: string = _resolved.debug
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

export type { WhichUrl, WhichUrlWithDebug, AppEnv, Platform, PlatformName, CreateUrlOptions } from "./types"
