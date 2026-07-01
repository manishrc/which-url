import type { ProviderDetector } from "./types"
import { getVar } from "./env-var"

export const providers: ProviderDetector[] = [
  {
    name: "vercel",
    detect: (env) => !!env.VERCEL || !!getVar(env, "VERCEL_ENV"),
    resolveUrl: (env) => {
      const vercelEnv = getVar(env, "VERCEL_ENV")
      if (vercelEnv === "production") {
        return getVar(env, "VERCEL_PROJECT_PRODUCTION_URL") || getVar(env, "VERCEL_URL") || null
      }
      return getVar(env, "VERCEL_BRANCH_URL") || getVar(env, "VERCEL_URL") || null
    },
    resolveProductionUrl: (env) =>
      getVar(env, "VERCEL_PROJECT_PRODUCTION_URL") || null,
    resolveEnv: (env) => {
      const vercelEnv = getVar(env, "VERCEL_ENV")
      if (vercelEnv === "production") return "production"
      if (vercelEnv === "preview") return "preview"
      return "local"
    },
    resolveAliasUrls: (env) =>
      [
        getVar(env, "VERCEL_PROJECT_PRODUCTION_URL"),
        getVar(env, "VERCEL_BRANCH_URL"),
        getVar(env, "VERCEL_URL"),
      ].filter((u): u is string => !!u),
  },
  {
    name: "netlify",
    detect: (env) => !!env.NETLIFY,
    resolveUrl: (env) => {
      if (env.CONTEXT === "production") return env.URL || null
      return env.DEPLOY_PRIME_URL || env.DEPLOY_URL || null
    },
    resolveProductionUrl: (env) => env.URL || null,
    resolveEnv: (env) => {
      if (env.CONTEXT === "production") return "production"
      if (env.CONTEXT === "deploy-preview" || env.CONTEXT === "branch-deploy")
        return "preview"
      return "local"
    },
    resolveAliasUrls: (env) =>
      [env.URL, env.DEPLOY_PRIME_URL, env.DEPLOY_URL].filter(
        (u): u is string => !!u
      ),
  },
  {
    name: "cloudflare",
    detect: (env) => !!env.CF_PAGES,
    resolveUrl: (env) => env.CF_PAGES_URL || null,
    // CF Pages exposes no "is this the production branch" flag, so we infer from
    // the conventional default branch names. Projects with a custom production
    // branch should set APP_ENV / APP_PRODUCTION_URL to override.
    resolveProductionUrl: (env) =>
      env.CF_PAGES_BRANCH === "main" || env.CF_PAGES_BRANCH === "master"
        ? env.CF_PAGES_URL || null
        : null,
    resolveEnv: (env) => {
      if (env.CF_PAGES_BRANCH === "main" || env.CF_PAGES_BRANCH === "master")
        return "production"
      return "preview"
    },
  },
  {
    name: "railway",
    detect: (env) => !!env.RAILWAY_PUBLIC_DOMAIN,
    resolveUrl: (env) => env.RAILWAY_PUBLIC_DOMAIN || null,
    resolveProductionUrl: (env) =>
      // Only the "production" environment's domain is canonical. In a PR/staging
      // environment RAILWAY_PUBLIC_DOMAIN points at that ephemeral deployment.
      env.RAILWAY_ENVIRONMENT_NAME === "production" ||
      env.RAILWAY_ENVIRONMENT === "production" ||
      (!env.RAILWAY_ENVIRONMENT_NAME && !env.RAILWAY_ENVIRONMENT)
        ? env.RAILWAY_PUBLIC_DOMAIN || null
        : null,
    resolveEnv: (env) => {
      // Railway environments are user-named; "production" is the default env.
      // Anything else (PR environments, staging) is a non-production deploy.
      const name = env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_ENVIRONMENT
      if (name && name !== "production") return "preview"
      return "production"
    },
  },
  {
    name: "fly",
    detect: (env) => !!env.FLY_APP_NAME,
    resolveUrl: (env) =>
      env.FLY_APP_NAME ? `${env.FLY_APP_NAME}.fly.dev` : null,
    resolveProductionUrl: (env) =>
      env.FLY_APP_NAME ? `${env.FLY_APP_NAME}.fly.dev` : null,
    resolveEnv: () => "production",
  },
  {
    name: "render",
    detect: (env) => !!env.RENDER,
    resolveUrl: (env) => env.RENDER_EXTERNAL_URL || null,
    resolveProductionUrl: (env) =>
      env.IS_PULL_REQUEST === "true" ? null : env.RENDER_EXTERNAL_URL || null,
    resolveEnv: (env) => {
      if (env.IS_PULL_REQUEST === "true") return "preview"
      return "production"
    },
  },
  {
    name: "digitalocean",
    detect: (env) => !!env.DIGITALOCEAN_APP_PLATFORM,
    resolveUrl: (env) => env.APP_URL || null,
    resolveProductionUrl: (env) => env.APP_URL || null,
    resolveEnv: () => "production",
  },
  {
    name: "heroku",
    detect: (env) => !!env.HEROKU_APP_NAME || !!env.HEROKU_APP_DEFAULT_DOMAIN_NAME,
    // Apps created after 2023-06-14 get a random suffix (app-1234567890ab.herokuapp.com),
    // so `${name}.herokuapp.com` is wrong. HEROKU_APP_DEFAULT_DOMAIN_NAME (dyno metadata)
    // is the real domain; fall back to the legacy pattern only when it's absent.
    resolveUrl: (env) =>
      env.HEROKU_APP_DEFAULT_DOMAIN_NAME ||
      (env.HEROKU_APP_NAME ? `${env.HEROKU_APP_NAME}.herokuapp.com` : null),
    resolveProductionUrl: (env) =>
      env.HEROKU_PR_NUMBER
        ? null
        : env.HEROKU_APP_DEFAULT_DOMAIN_NAME ||
          (env.HEROKU_APP_NAME ? `${env.HEROKU_APP_NAME}.herokuapp.com` : null),
    // Review apps set HEROKU_PR_NUMBER (dyno metadata).
    resolveEnv: (env) => (env.HEROKU_PR_NUMBER ? "preview" : "production"),
  },
]
