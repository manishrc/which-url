import { providers } from "./providers"
import type { AppEnv } from "./types"

const validEnvs: AppEnv[] = ["production", "preview", "local"]

export function resolveEnv(): AppEnv {
  const env = typeof process !== "undefined" ? process.env : {}

  // 1. Explicit override
  if (env.APP_ENV && validEnvs.includes(env.APP_ENV as AppEnv)) {
    return env.APP_ENV as AppEnv
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
