import { providers } from "./providers"
import { normalizeUrl } from "./normalize"
import { getVar, getEnv } from "./env-var"
import type { Platform, Source } from "./types"

export interface ResolveResult {
  url: string
  source: Source
}

export function resolveUrl(): ResolveResult {
  const env = getEnv()

  // 1. User override — checks APP_URL, NEXT_PUBLIC_APP_URL, VITE_APP_URL, etc.
  const override = getVar(env, "APP_URL")
  if (override) return { url: normalizeUrl(override), source: "override" }

  // 2. Provider detection
  for (const p of providers) {
    if (p.detect(env)) {
      const url = p.resolveUrl(env)
      if (url) return { url: normalizeUrl(url), source: "provider" }
    }
  }

  // 3. Browser fallback
  if (typeof window !== "undefined" && window.location) {
    return { url: window.location.origin, source: "browser" }
  }

  // 4. Development fallback
  const isProduction = env.NODE_ENV === "production"
  if (!isProduction) {
    const port = env.PORT || "3000"
    return { url: `http://localhost:${port}`, source: "fallback" }
  }

  // 5. Production — throw
  throw new Error(
    "which-url: Cannot detect app URL. Set APP_URL environment variable."
  )
}

export function resolvePlatform(): Platform {
  const env = getEnv()
  for (const p of providers) {
    if (p.detect(env)) {
      return p.name as Platform
    }
  }
  return null
}
