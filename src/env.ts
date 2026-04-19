import { providers } from "./providers"
import { getVar, getEnv } from "./env-var"
import type { AppEnv } from "./types"

const validEnvs: AppEnv[] = ["production", "preview", "local"]

export function resolveEnv(): AppEnv {
  const env = getEnv()

  // 1. Explicit override — checks APP_ENV, NEXT_PUBLIC_APP_ENV, VITE_APP_ENV, etc.
  const appEnv = getVar(env, "APP_ENV")
  if (appEnv && validEnvs.includes(appEnv as AppEnv)) {
    return appEnv as AppEnv
  }

  // 2. NODE_ENV=development → local
  if (env.NODE_ENV === "development") return "local"

  // 3. Provider detection
  for (const p of providers) {
    if (p.detect(env)) {
      return p.resolveEnv(env)
    }
  }

  // 4. NODE_ENV=production → production
  if (env.NODE_ENV === "production") return "production"

  // 5. Fallback
  return "local"
}
