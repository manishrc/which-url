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
    resolveEnv: (env) => {
      const vercelEnv = getVar(env, "VERCEL_ENV")
      if (vercelEnv === "production") return "production"
      if (vercelEnv === "preview") return "preview"
      return "local"
    },
  },
  {
    name: "netlify",
    detect: (env) => !!env.NETLIFY,
    resolveUrl: (env) => {
      if (env.CONTEXT === "production") return env.URL || null
      return env.DEPLOY_PRIME_URL || env.DEPLOY_URL || null
    },
    resolveEnv: (env) => {
      if (env.CONTEXT === "production") return "production"
      if (env.CONTEXT === "deploy-preview" || env.CONTEXT === "branch-deploy")
        return "preview"
      return "local"
    },
  },
  {
    name: "cloudflare",
    detect: (env) => !!env.CF_PAGES,
    resolveUrl: (env) => env.CF_PAGES_URL || null,
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
    resolveEnv: (env) => {
      if (env.RAILWAY_ENVIRONMENT === "production") return "production"
      return "production"
    },
  },
  {
    name: "fly",
    detect: (env) => !!env.FLY_APP_NAME,
    resolveUrl: (env) =>
      env.FLY_APP_NAME ? `${env.FLY_APP_NAME}.fly.dev` : null,
    resolveEnv: () => "production",
  },
  {
    name: "render",
    detect: (env) => !!env.RENDER,
    resolveUrl: (env) => env.RENDER_EXTERNAL_URL || null,
    resolveEnv: (env) => {
      if (env.IS_PULL_REQUEST === "true") return "preview"
      return "production"
    },
  },
  {
    name: "digitalocean",
    detect: (env) => !!env.DIGITALOCEAN_APP_PLATFORM,
    resolveUrl: (env) => env.APP_URL || null,
    resolveEnv: () => "production",
  },
  {
    name: "heroku",
    detect: (env) => !!env.HEROKU_APP_NAME,
    resolveUrl: (env) =>
      env.HEROKU_APP_NAME ? `${env.HEROKU_APP_NAME}.herokuapp.com` : null,
    resolveEnv: () => "production",
  },
]
