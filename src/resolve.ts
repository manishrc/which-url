import { providers } from "./providers"
import { normalizeUrl } from "./normalize"
import type { CreateUrlOptions } from "./types"

export function resolveUrl(options?: CreateUrlOptions): string {
  const env = typeof process !== "undefined" ? process.env : {}

  // 1. User override
  const override = env.APP_URL || env.NEXT_PUBLIC_APP_URL
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
    "thisapp: Cannot detect app URL. Set APP_URL environment variable."
  )
}
