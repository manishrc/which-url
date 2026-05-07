import { providers } from "./providers"
import { normalizeUrl } from "./normalize"
import { getVar, getEnv } from "./env-var"
import type { Platform } from "./types"

export interface ResolveResult {
  url: string
  debugLabel: string
}

export function resolveUrl(envOverride?: object): ResolveResult {
  const env = getEnv(envOverride)

  // 1. User override — checks APP_URL, NEXT_PUBLIC_APP_URL, VITE_APP_URL, etc.
  const override = getVar(env, "APP_URL")
  if (override) return { url: normalizeUrl(override), debugLabel: `[override] APP_URL=${override}` }

  // 2. Portless — prefer Tailscale URL (publicly accessible) over local .localhost
  if (env.PORTLESS_TAILSCALE_URL) {
    return { url: env.PORTLESS_TAILSCALE_URL, debugLabel: `[portless:tailscale] PORTLESS_TAILSCALE_URL=${env.PORTLESS_TAILSCALE_URL}` }
  }
  if (env.PORTLESS_URL) {
    return { url: env.PORTLESS_URL, debugLabel: `[portless] PORTLESS_URL=${env.PORTLESS_URL}` }
  }

  // 3. Provider detection
  for (const p of providers) {
    if (p.detect(env)) {
      const url = p.resolveUrl(env)
      if (url) return { url: normalizeUrl(url), debugLabel: `[provider:${p.name}] url=${url}` }
    }
  }

  // 4. Browser fallback
  if (typeof window !== "undefined" && window.location) {
    return { url: window.location.origin, debugLabel: `[browser] window.location.origin` }
  }

  // 5. Development fallback
  const isProduction = env.NODE_ENV === "production"
  if (!isProduction) {
    const port = env.PORT || "3000"
    return { url: `http://localhost:${port}`, debugLabel: `[fallback] PORT=${port}` }
  }

  // 6. Production — throw
  throw new Error(
    "which-url: Cannot detect app URL. Set APP_URL environment variable."
  )
}

export function resolvePlatform(envOverride?: object): Platform {
  const env = getEnv(envOverride)
  for (const p of providers) {
    if (p.detect(env)) {
      return p.name
    }
  }
  return null
}
