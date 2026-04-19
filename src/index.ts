import { resolveUrl, resolvePlatform } from "./resolve"
import { resolveEnv } from "./env"
import type { WhichUrl, AppEnv, Platform, CreateUrlOptions } from "./types"

export function createUrl(options?: CreateUrlOptions): WhichUrl {
  const resolved = resolveUrl(options)
  const parsed = new URL(resolved)
  const env = resolveEnv()
  const platform = resolvePlatform()
  return {
    href: parsed.origin,
    origin: parsed.origin,
    hostname: parsed.hostname,
    host: parsed.host,
    protocol: parsed.protocol,
    port: parsed.port,
    env,
    platform,
    isProduction: env === "production",
    isPreview: env === "preview",
    isLocal: env === "local",
  }
}

// Eager singleton — warn if resolution fails at import time
let _resolved: WhichUrl
try {
  _resolved = createUrl()
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
export const isProduction: boolean = _resolved.isProduction
export const isPreview: boolean = _resolved.isPreview
export const isLocal: boolean = _resolved.isLocal

// Default export — object
export default _resolved

export type { WhichUrl, AppEnv, Platform, CreateUrlOptions }
