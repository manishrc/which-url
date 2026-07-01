import { providers } from "./providers"
import { normalizeUrl } from "./normalize"
import { getVar, getEnv } from "./env-var"
import { resolveEnv } from "./env"
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

  // 2. Portless — prefer publicly-reachable URLs (Tailscale/funnel, ngrok)
  // over the local .localhost one. All of them land in `allowedOrigins`.
  if (env.PORTLESS_TAILSCALE_URL) {
    return { url: normalizeUrl(env.PORTLESS_TAILSCALE_URL), debugLabel: `[portless:tailscale] PORTLESS_TAILSCALE_URL=${env.PORTLESS_TAILSCALE_URL}` }
  }
  if (env.PORTLESS_NGROK_URL) {
    return { url: normalizeUrl(env.PORTLESS_NGROK_URL), debugLabel: `[portless:ngrok] PORTLESS_NGROK_URL=${env.PORTLESS_NGROK_URL}` }
  }
  if (env.PORTLESS_URL) {
    return { url: normalizeUrl(env.PORTLESS_URL), debugLabel: `[portless] PORTLESS_URL=${env.PORTLESS_URL}` }
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

  // 5. Development fallback — only when we are NOT resolving a production env.
  // Keyed on the fully-resolved env (APP_ENV / provider / NODE_ENV), not NODE_ENV
  // alone, so `APP_ENV=production` with no URL fails loudly instead of silently
  // returning localhost.
  const { env: resolvedEnv } = resolveEnv(envOverride)
  if (resolvedEnv !== "production") {
    const port = env.PORT || "3000"
    return { url: `http://localhost:${port}`, debugLabel: `[fallback] PORT=${port}` }
  }

  // 6. Production — throw
  throw new Error(
    "which-url: Cannot detect app URL. Set APP_URL environment variable."
  )
}

export function resolveProductionUrl(envOverride?: object): ResolveResult | null {
  const env = getEnv(envOverride)

  // 1. Explicit production override — separate from APP_URL so local
  // APP_URL=http://localhost:3000 does not become the canonical URL.
  const override = getVar(env, "APP_PRODUCTION_URL")
  if (override) {
    return {
      url: normalizeUrl(override),
      debugLabel: `[production:override] APP_PRODUCTION_URL=${override}`,
    }
  }

  // 2. Provider-specific production URL when the platform exposes one.
  for (const p of providers) {
    if (p.detect(env)) {
      const url = p.resolveProductionUrl?.(env)
      if (url) {
        return {
          url: normalizeUrl(url),
          debugLabel: `[production:provider:${p.name}] url=${url}`,
        }
      }
    }
  }

  // 3. If this is actually production, APP_URL/current provider URL is also
  // the production URL. Avoid this fallback for local/preview.
  for (const p of providers) {
    if (p.detect(env) && p.resolveEnv(env) === "production") {
      const url = p.resolveUrl(env)
      if (url) {
        return {
          url: normalizeUrl(url),
          debugLabel: `[production:current:${p.name}] url=${url}`,
        }
      }
    }
  }

  const appUrl = getVar(env, "APP_URL")
  if (appUrl && resolveEnv(envOverride).env === "production") {
    return {
      url: normalizeUrl(appUrl),
      debugLabel: `[production:current] APP_URL=${appUrl}`,
    }
  }

  return null
}

/**
 * Every URL that is also this app in the current environment, beyond the
 * primary resolved URL. Used to build the `allowedOrigins` allow-list. Values are
 * normalized but not deduped — callers dedupe by parsed origin.
 */
export function resolveAliasUrls(envOverride?: object): string[] {
  const env = getEnv(envOverride)
  const urls: string[] = []

  // Portless can expose the app on several hostnames at once.
  if (env.PORTLESS_TAILSCALE_URL) urls.push(normalizeUrl(env.PORTLESS_TAILSCALE_URL))
  if (env.PORTLESS_NGROK_URL) urls.push(normalizeUrl(env.PORTLESS_NGROK_URL))
  if (env.PORTLESS_URL) urls.push(normalizeUrl(env.PORTLESS_URL))

  // First detected provider's aliases (deployment URL, branch URL, etc.).
  for (const p of providers) {
    if (p.detect(env)) {
      for (const u of p.resolveAliasUrls?.(env) ?? []) urls.push(normalizeUrl(u))
      break
    }
  }

  // Canonical production origin is always one of ours.
  const production = resolveProductionUrl(envOverride)
  if (production) urls.push(production.url)

  // Local dev: the app also answers on localhost directly.
  if (resolveEnv(envOverride).env === "local") {
    urls.push(`http://localhost:${env.PORT || "3000"}`)
  }

  return urls
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
