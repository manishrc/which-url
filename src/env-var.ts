// Env var names that which-url needs to read.
// Each must appear as a static `process.env.X` reference so bundlers can inline them.
const ENV_VARS = [
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "APP_URL",
  "APP_ENV",
] as const

type EnvVarName = (typeof ENV_VARS)[number]

// Framework prefixes that Vercel auto-creates for client-side access.
// Bundlers statically replace `process.env.NEXT_PUBLIC_X` at build time —
// dynamic access like `process.env["NEXT_PUBLIC_" + name]` does NOT work.
// Every reference must be a string literal for the bundler to find it.

function readStatic(name: EnvVarName): string | undefined {
  // prettier-ignore
  switch (name) {
    case "VERCEL_ENV":
      return process.env.VERCEL_ENV
        || process.env.NEXT_PUBLIC_VERCEL_ENV
        || process.env.NUXT_ENV_VERCEL_ENV
        || process.env.VITE_VERCEL_ENV
        || process.env.PUBLIC_VERCEL_ENV
        || process.env.REACT_APP_VERCEL_ENV
        || process.env.GATSBY_VERCEL_ENV
        || process.env.VUE_APP_VERCEL_ENV
        || process.env.REDWOOD_ENV_VERCEL_ENV
        || process.env.SANITY_STUDIO_VERCEL_ENV
        || undefined
    case "VERCEL_URL":
      return process.env.VERCEL_URL
        || process.env.NEXT_PUBLIC_VERCEL_URL
        || process.env.NUXT_ENV_VERCEL_URL
        || process.env.VITE_VERCEL_URL
        || process.env.PUBLIC_VERCEL_URL
        || process.env.REACT_APP_VERCEL_URL
        || process.env.GATSBY_VERCEL_URL
        || process.env.VUE_APP_VERCEL_URL
        || process.env.REDWOOD_ENV_VERCEL_URL
        || process.env.SANITY_STUDIO_VERCEL_URL
        || undefined
    case "VERCEL_BRANCH_URL":
      return process.env.VERCEL_BRANCH_URL
        || process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
        || process.env.NUXT_ENV_VERCEL_BRANCH_URL
        || process.env.VITE_VERCEL_BRANCH_URL
        || process.env.PUBLIC_VERCEL_BRANCH_URL
        || process.env.REACT_APP_VERCEL_BRANCH_URL
        || process.env.GATSBY_VERCEL_BRANCH_URL
        || process.env.VUE_APP_VERCEL_BRANCH_URL
        || process.env.REDWOOD_ENV_VERCEL_BRANCH_URL
        || process.env.SANITY_STUDIO_VERCEL_BRANCH_URL
        || undefined
    case "VERCEL_PROJECT_PRODUCTION_URL":
      return process.env.VERCEL_PROJECT_PRODUCTION_URL
        || process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.NUXT_ENV_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.VITE_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.REACT_APP_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.GATSBY_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.VUE_APP_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.REDWOOD_ENV_VERCEL_PROJECT_PRODUCTION_URL
        || process.env.SANITY_STUDIO_VERCEL_PROJECT_PRODUCTION_URL
        || undefined
    case "APP_URL":
      return process.env.APP_URL
        || process.env.NEXT_PUBLIC_APP_URL
        || process.env.NUXT_ENV_APP_URL
        || process.env.VITE_APP_URL
        || process.env.PUBLIC_APP_URL
        || process.env.REACT_APP_APP_URL
        || process.env.GATSBY_APP_URL
        || process.env.VUE_APP_APP_URL
        || process.env.REDWOOD_ENV_APP_URL
        || process.env.SANITY_STUDIO_APP_URL
        || undefined
    case "APP_ENV":
      return process.env.APP_ENV
        || process.env.NEXT_PUBLIC_APP_ENV
        || process.env.NUXT_ENV_APP_ENV
        || process.env.VITE_APP_ENV
        || process.env.PUBLIC_APP_ENV
        || process.env.REACT_APP_APP_ENV
        || process.env.GATSBY_APP_ENV
        || process.env.VUE_APP_APP_ENV
        || process.env.REDWOOD_ENV_APP_ENV
        || process.env.SANITY_STUDIO_APP_ENV
        || undefined
    default:
      return undefined
  }
}

/**
 * Read an env var, checking all framework-prefixed versions.
 * On the server, unprefixed wins (it's always set).
 * On the client, the bundler inlines the prefixed version.
 *
 * When called with an `env` object (e.g. from provider detection),
 * falls back to dynamic lookup for test/server compatibility.
 */
export function getVar(
  env: Record<string, string | undefined>,
  name: string
): string | undefined {
  // Try static references first — these get inlined by bundlers
  if (typeof process !== "undefined" && process?.env && env === process.env) {
    if ((ENV_VARS as readonly string[]).includes(name)) {
      const val = readStatic(name as EnvVarName)
      if (val) return val
    }
  }

  // Dynamic fallback — works in tests and on the server where process.env
  // is a real object, and for provider `env` objects passed directly.
  const PREFIXES = [
    "",
    "NEXT_PUBLIC_",
    "NUXT_ENV_",
    "VITE_",
    "PUBLIC_",
    "REACT_APP_",
    "GATSBY_",
    "VUE_APP_",
    "REDWOOD_ENV_",
    "SANITY_STUDIO_",
  ]
  for (const prefix of PREFIXES) {
    const val = env[prefix + name]
    if (val) return val
  }
  return undefined
}

export function getEnv(
  override?: Record<string, unknown>
): Record<string, string | undefined> {
  if (override !== undefined) {
    return filterStrings(override)
  }
  if (typeof process !== "undefined" && process?.env) {
    return process.env
  }
  return {}
}

// Workers bindings (KV, DO, R2, service bindings) come through `env` as objects.
// URL detection only works on strings, so drop everything else at the boundary.
function filterStrings(
  source: Record<string, unknown>
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const key in source) {
    const value = source[key]
    if (typeof value === "string") out[key] = value
  }
  return out
}
