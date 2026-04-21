import { providers } from "./providers"
import { getVar, getEnv } from "./env-var"
import type { AppEnv } from "./types"

const validEnvs: AppEnv[] = ["production", "preview", "local"]

export interface EnvResult {
  env: AppEnv
  debugLabel: string
}

export function resolveEnv(): EnvResult {
  const env = getEnv()

  // 1. Explicit override — checks APP_ENV, NEXT_PUBLIC_APP_ENV, VITE_APP_ENV, etc.
  const appEnv = getVar(env, "APP_ENV")
  if (appEnv && validEnvs.includes(appEnv as AppEnv)) {
    return { env: appEnv as AppEnv, debugLabel: `APP_ENV=${appEnv}` }
  }

  // 2. NODE_ENV=development → local
  if (env.NODE_ENV === "development") return { env: "local", debugLabel: "NODE_ENV=development" }

  // 3. Provider detection
  for (const p of providers) {
    if (p.detect(env)) {
      const resolved = p.resolveEnv(env)
      return { env: resolved, debugLabel: `${p.name}:${resolved}` }
    }
  }

  // 4. NODE_ENV=production → production
  if (env.NODE_ENV === "production") return { env: "production", debugLabel: "NODE_ENV=production" }

  // 5. Fallback
  return { env: "local", debugLabel: "default" }
}
