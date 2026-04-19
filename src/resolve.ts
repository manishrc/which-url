import { providers } from "./providers"
import { normalizeUrl } from "./normalize"
import { getVar, getEnv } from "./env-var"
import type { CreateUrlOptions, Platform } from "./types"

export function resolveUrl(options?: CreateUrlOptions): string {
  const env = getEnv()

  // 1. User override — checks APP_URL, NEXT_PUBLIC_APP_URL, VITE_APP_URL, etc.
  const override = getVar(env, "APP_URL")
  if (override) return normalizeUrl(override)

  // 2. Provider detection
  for (const p of providers) {
    if (p.detect(env)) {
      const url = p.resolveUrl(env)
      if (url) return normalizeUrl(url)
    }
  }

  // 3. Browser fallback
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin
  }

  // 4. Development fallback
  const isProduction = env.NODE_ENV === "production"
  if (!isProduction) {
    const port = env.PORT || "3000"
    return `http://localhost:${port}`
  }

  // 5. Production with fallback option
  if (options?.fallback) {
    return normalizeUrl(options.fallback)
  }

  // 6. Production without fallback — throw
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
