import { describe, test, expect } from "bun:test"
import { providers } from "../src/providers"

function findProvider(name: string) {
  return providers.find((p) => p.name === name)!
}

describe("Vercel provider", () => {
  test("detects Vercel environment", () => {
    const vercel = findProvider("vercel")
    expect(vercel.detect({ VERCEL: "1" })).toBe(true)
    expect(vercel.detect({})).toBe(false)
  })

  test("resolves production URL from VERCEL_PROJECT_PRODUCTION_URL", () => {
    const vercel = findProvider("vercel")
    expect(
      vercel.resolveUrl({
        VERCEL: "1",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "myapp.com",
        VERCEL_URL: "myapp-abc123.vercel.app",
      })
    ).toBe("myapp.com")
  })

  test("resolves preview URL from VERCEL_BRANCH_URL then VERCEL_URL", () => {
    const vercel = findProvider("vercel")
    expect(
      vercel.resolveUrl({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "myapp-git-feature.vercel.app",
        VERCEL_URL: "myapp-abc123.vercel.app",
      })
    ).toBe("myapp-git-feature.vercel.app")

    expect(
      vercel.resolveUrl({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_URL: "myapp-abc123.vercel.app",
      })
    ).toBe("myapp-abc123.vercel.app")
  })

  test("resolves environment from VERCEL_ENV", () => {
    const vercel = findProvider("vercel")
    expect(vercel.resolveEnv({ VERCEL_ENV: "production" })).toBe("production")
    expect(vercel.resolveEnv({ VERCEL_ENV: "preview" })).toBe("preview")
    expect(vercel.resolveEnv({ VERCEL_ENV: "development" })).toBe("local")
  })

  test("detects Vercel from NEXT_PUBLIC_VERCEL_ENV (client-side Next.js)", () => {
    const vercel = findProvider("vercel")
    expect(vercel.detect({ NEXT_PUBLIC_VERCEL_ENV: "production" })).toBe(true)
  })

  test("detects Vercel from VITE_VERCEL_ENV (client-side Vite)", () => {
    const vercel = findProvider("vercel")
    expect(vercel.detect({ VITE_VERCEL_ENV: "preview" })).toBe(true)
  })

  test("resolves production URL from NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL", () => {
    const vercel = findProvider("vercel")
    expect(
      vercel.resolveUrl({
        NEXT_PUBLIC_VERCEL_ENV: "production",
        NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: "myapp.com",
      })
    ).toBe("myapp.com")
  })

  test("resolves preview URL from VITE_VERCEL_BRANCH_URL", () => {
    const vercel = findProvider("vercel")
    expect(
      vercel.resolveUrl({
        VITE_VERCEL_ENV: "preview",
        VITE_VERCEL_BRANCH_URL: "myapp-git-feat.vercel.app",
      })
    ).toBe("myapp-git-feat.vercel.app")
  })

  test("resolves env from PUBLIC_VERCEL_ENV (Astro client)", () => {
    const vercel = findProvider("vercel")
    expect(vercel.resolveEnv({ PUBLIC_VERCEL_ENV: "production" })).toBe("production")
    expect(vercel.resolveEnv({ PUBLIC_VERCEL_ENV: "preview" })).toBe("preview")
  })
})

describe("Netlify provider", () => {
  test("detects Netlify environment", () => {
    const netlify = findProvider("netlify")
    expect(netlify.detect({ NETLIFY: "true" })).toBe(true)
    expect(netlify.detect({})).toBe(false)
  })

  test("resolves production URL from URL", () => {
    const netlify = findProvider("netlify")
    expect(
      netlify.resolveUrl({ CONTEXT: "production", URL: "https://mysite.netlify.app" })
    ).toBe("https://mysite.netlify.app")
  })

  test("resolves preview URL from DEPLOY_PRIME_URL", () => {
    const netlify = findProvider("netlify")
    expect(
      netlify.resolveUrl({
        CONTEXT: "deploy-preview",
        DEPLOY_PRIME_URL: "https://deploy-preview-42--mysite.netlify.app",
        DEPLOY_URL: "https://abc123--mysite.netlify.app",
      })
    ).toBe("https://deploy-preview-42--mysite.netlify.app")
  })

  test("resolves environment from CONTEXT", () => {
    const netlify = findProvider("netlify")
    expect(netlify.resolveEnv({ CONTEXT: "production" })).toBe("production")
    expect(netlify.resolveEnv({ CONTEXT: "deploy-preview" })).toBe("preview")
    expect(netlify.resolveEnv({ CONTEXT: "branch-deploy" })).toBe("preview")
  })
})

describe("Cloudflare Pages provider", () => {
  test("detects CF Pages environment", () => {
    const cf = findProvider("cloudflare")
    expect(cf.detect({ CF_PAGES: "1" })).toBe(true)
    expect(cf.detect({})).toBe(false)
  })

  test("resolves URL from CF_PAGES_URL", () => {
    const cf = findProvider("cloudflare")
    expect(
      cf.resolveUrl({ CF_PAGES_URL: "https://abc123.myproject.pages.dev" })
    ).toBe("https://abc123.myproject.pages.dev")
  })

  test("resolves environment", () => {
    const cf = findProvider("cloudflare")
    expect(cf.resolveEnv({ CF_PAGES_BRANCH: "main" })).toBe("production")
    expect(cf.resolveEnv({ CF_PAGES_BRANCH: "feature-x" })).toBe("preview")
  })
})

describe("Railway provider", () => {
  test("detects Railway environment", () => {
    const railway = findProvider("railway")
    expect(railway.detect({ RAILWAY_PUBLIC_DOMAIN: "myapp.up.railway.app" })).toBe(true)
    expect(railway.detect({})).toBe(false)
  })

  test("resolves URL from RAILWAY_PUBLIC_DOMAIN", () => {
    const railway = findProvider("railway")
    expect(
      railway.resolveUrl({ RAILWAY_PUBLIC_DOMAIN: "myapp.up.railway.app" })
    ).toBe("myapp.up.railway.app")
  })

  test("resolves environment from RAILWAY_ENVIRONMENT", () => {
    const railway = findProvider("railway")
    expect(railway.resolveEnv({ RAILWAY_ENVIRONMENT: "production" })).toBe("production")
    expect(railway.resolveEnv({})).toBe("production")
  })
})

describe("Fly.io provider", () => {
  test("detects Fly environment", () => {
    const fly = findProvider("fly")
    expect(fly.detect({ FLY_APP_NAME: "myapp" })).toBe(true)
    expect(fly.detect({})).toBe(false)
  })

  test("constructs URL from FLY_APP_NAME", () => {
    const fly = findProvider("fly")
    expect(fly.resolveUrl({ FLY_APP_NAME: "myapp" })).toBe("myapp.fly.dev")
  })

  test("defaults to production", () => {
    const fly = findProvider("fly")
    expect(fly.resolveEnv({})).toBe("production")
  })
})

describe("Render provider", () => {
  test("detects Render environment", () => {
    const render = findProvider("render")
    expect(render.detect({ RENDER: "true" })).toBe(true)
    expect(render.detect({})).toBe(false)
  })

  test("resolves URL from RENDER_EXTERNAL_URL", () => {
    const render = findProvider("render")
    expect(
      render.resolveUrl({ RENDER_EXTERNAL_URL: "https://myapp.onrender.com" })
    ).toBe("https://myapp.onrender.com")
  })

  test("resolves environment from IS_PULL_REQUEST", () => {
    const render = findProvider("render")
    expect(render.resolveEnv({ IS_PULL_REQUEST: "true" })).toBe("preview")
    expect(render.resolveEnv({})).toBe("production")
  })
})

describe("DigitalOcean provider", () => {
  test("detects DO environment", () => {
    const doProvider = findProvider("digitalocean")
    expect(doProvider.detect({ DIGITALOCEAN_APP_PLATFORM: "true" })).toBe(true)
    expect(doProvider.detect({})).toBe(false)
  })

  test("resolves URL from APP_URL", () => {
    const doProvider = findProvider("digitalocean")
    expect(
      doProvider.resolveUrl({ APP_URL: "https://myapp.ondigitalocean.app" })
    ).toBe("https://myapp.ondigitalocean.app")
  })

  test("defaults to production", () => {
    const doProvider = findProvider("digitalocean")
    expect(doProvider.resolveEnv({})).toBe("production")
  })
})

describe("Heroku provider", () => {
  test("detects Heroku environment", () => {
    const heroku = findProvider("heroku")
    expect(heroku.detect({ HEROKU_APP_NAME: "myapp" })).toBe(true)
    expect(heroku.detect({})).toBe(false)
  })

  test("constructs URL from HEROKU_APP_NAME", () => {
    const heroku = findProvider("heroku")
    expect(heroku.resolveUrl({ HEROKU_APP_NAME: "myapp" })).toBe("myapp.herokuapp.com")
  })

  test("defaults to production", () => {
    const heroku = findProvider("heroku")
    expect(heroku.resolveEnv({})).toBe("production")
  })
})
