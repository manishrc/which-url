import { resolveUrl, resolvePlatform } from "./resolve"
import { resolveEnv } from "./env"
import type { WhichUrl, AppEnv, Platform, Source } from "./types"

function resolve(): WhichUrl {
  const { url, source } = resolveUrl()
  const parsed = new URL(url)
  const env = resolveEnv()
  const platform = resolvePlatform()
  const debug = `platform=${platform ?? "none"} | source=${source} | url=${parsed.origin} | env=${env}`
  return {
    href: parsed.origin,
    origin: parsed.origin,
    hostname: parsed.hostname,
    host: parsed.host,
    protocol: parsed.protocol,
    port: parsed.port,
    env,
    platform,
    source,
    debug,
    isProduction: env === "production",
    isPreview: env === "preview",
    isLocal: env === "local",
  }
}

// Eager singleton — warn if resolution fails at import time
let _resolved: WhichUrl
try {
  _resolved = resolve()
} catch (e) {
  console.warn(
    `[which-url] Could not detect app URL. Set APP_URL (e.g. APP_URL=https://myapp.com or APP_URL=myapp.com)`
  )
  _resolved = {
    href: "",
    origin: "",
    hostname: "",
    host: "",
    protocol: "",
    port: "",
    env: "local",
    platform: null,
    source: null,
    debug: "platform=none | source=none | url=none | env=local",
    isProduction: false,
    isPreview: false,
    isLocal: true,
  }
}

// Named exports — plain primitives
export const href: string = _resolved.href
export const origin: string = _resolved.origin
export const hostname: string = _resolved.hostname
export const host: string = _resolved.host
export const protocol: string = _resolved.protocol
export const port: string = _resolved.port
export const env: AppEnv = _resolved.env
export const platform: Platform = _resolved.platform
export const source: Source = _resolved.source
export const debug: string = _resolved.debug
export const isProduction: boolean = _resolved.isProduction
export const isPreview: boolean = _resolved.isPreview
export const isLocal: boolean = _resolved.isLocal

// Default export — object
export default _resolved

export type { WhichUrl, AppEnv, Platform, Source }
