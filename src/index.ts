import { resolveUrl } from "./resolve"
import { resolveEnv } from "./env"
import type { WhichUrl, AppEnv, CreateUrlOptions } from "./types"

export function createUrl(options?: CreateUrlOptions): WhichUrl {
  const resolved = resolveUrl(options)
  const parsed = new URL(resolved)
  const env = resolveEnv()
  return {
    href: parsed.origin,
    origin: parsed.origin,
    hostname: parsed.hostname,
    host: parsed.host,
    protocol: parsed.protocol,
    port: parsed.port,
    env,
    isProduction: env === "production",
    isPreview: env === "preview",
    isLocal: env === "local",
  }
}

// Eager singleton
const _resolved = createUrl()

// Named exports — plain primitives
export const href: string = _resolved.href
export const origin: string = _resolved.origin
export const hostname: string = _resolved.hostname
export const host: string = _resolved.host
export const protocol: string = _resolved.protocol
export const port: string = _resolved.port
export const env: AppEnv = _resolved.env
export const isProduction: boolean = _resolved.isProduction
export const isPreview: boolean = _resolved.isPreview
export const isLocal: boolean = _resolved.isLocal

// Default export — object
export default _resolved

export type { WhichUrl, AppEnv, CreateUrlOptions }
