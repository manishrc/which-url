import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { resolveUrl } from "../src/resolve"
import { resolveEnv } from "../src/env"

let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
  delete process.env.APP_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.VERCEL
  delete process.env.VERCEL_ENV
  delete process.env.VERCEL_URL
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  delete process.env.VERCEL_BRANCH_URL
  delete process.env.PORTLESS_URL
  delete process.env.PORTLESS_TAILSCALE_URL
  process.env.NODE_ENV = "development"
})

afterEach(() => {
  process.env = savedEnv
})

describe("which-url public API", () => {
  test("resolves URL with correct properties", () => {
    process.env.APP_URL = "https://myapp.vercel.app"
    const { url } = resolveUrl()
    const parsed = new URL(url)

    expect(parsed.origin).toBe("https://myapp.vercel.app")
    expect(parsed.hostname).toBe("myapp.vercel.app")
    expect(parsed.host).toBe("myapp.vercel.app")
    expect(parsed.protocol).toBe("https:")
    expect(parsed.port).toBe("")
  })

  test("resolves env from provider", () => {
    process.env.NODE_ENV = "production"
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "preview"
    expect(resolveEnv().env).toBe("preview")
  })

  test("resolves localhost with custom port", () => {
    process.env.NODE_ENV = "development"
    process.env.PORT = "4567"
    const { url } = resolveUrl()
    const parsed = new URL(url)

    expect(parsed.origin).toBe("http://localhost:4567")
    expect(parsed.hostname).toBe("localhost")
    expect(parsed.port).toBe("4567")
    expect(parsed.protocol).toBe("http:")
  })

  test("throws in production when no URL detected", () => {
    process.env.NODE_ENV = "production"
    expect(() => resolveUrl()).toThrow("which-url: Cannot detect app URL")
  })

  test("debug label includes override source", () => {
    process.env.APP_URL = "https://myapp.com"
    const { debugLabel } = resolveUrl()
    expect(debugLabel).toContain("[override]")
    expect(debugLabel).toContain("APP_URL=https://myapp.com")
  })

  test("debug label includes provider source", () => {
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "production"
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.com"
    const { debugLabel } = resolveUrl()
    expect(debugLabel).toContain("[provider:vercel]")
  })

  test("debug label includes fallback with port", () => {
    process.env.NODE_ENV = "development"
    process.env.PORT = "4091"
    const { debugLabel } = resolveUrl()
    expect(debugLabel).toContain("[fallback]")
    expect(debugLabel).toContain("PORT=4091")
  })

  test("debug label includes portless source", () => {
    process.env.PORTLESS_URL = "https://myapp.localhost"
    const { url, debugLabel } = resolveUrl()
    expect(url).toBe("https://myapp.localhost")
    expect(debugLabel).toContain("[portless]")
    expect(debugLabel).toContain("PORTLESS_URL=https://myapp.localhost")
  })

  test("PORTLESS_TAILSCALE_URL wins over PORTLESS_URL", () => {
    process.env.PORTLESS_URL = "https://myapp.localhost"
    process.env.PORTLESS_TAILSCALE_URL = "https://myapp.your-tailnet.ts.net"
    const { url, debugLabel } = resolveUrl()
    expect(url).toBe("https://myapp.your-tailnet.ts.net")
    expect(debugLabel).toContain("[portless:tailscale]")
    expect(debugLabel).toContain("PORTLESS_TAILSCALE_URL=https://myapp.your-tailnet.ts.net")
  })

  test("APP_URL still wins over PORTLESS_TAILSCALE_URL", () => {
    process.env.APP_URL = "https://override.example.com"
    process.env.PORTLESS_TAILSCALE_URL = "https://myapp.your-tailnet.ts.net"
    const { url } = resolveUrl()
    expect(url).toBe("https://override.example.com")
  })

  test("createUrl resolves fresh environment values", () => {
    process.env.APP_URL = "https://fresh.example.com"
    const { createUrl } = require("../src/index")

    expect(createUrl().origin).toBe("https://fresh.example.com")
  })

  test("createUrl throws when production URL cannot be resolved", () => {
    process.env.NODE_ENV = "production"
    const { createUrl } = require("../src/index")

    expect(() => createUrl()).toThrow("which-url: Cannot detect app URL")
  })

  test("default import stays quiet and best-effort when production URL cannot be resolved", () => {
    const env = { ...process.env, NODE_ENV: "production" }
    delete env.APP_URL
    delete env.NEXT_PUBLIC_APP_URL
    delete env.VERCEL
    delete env.VERCEL_ENV
    delete env.VERCEL_URL
    delete env.VERCEL_PROJECT_PRODUCTION_URL
    delete env.VERCEL_BRANCH_URL

    const result = Bun.spawnSync({
      cmd: [
        "bun",
        "-e",
        "import appUrl from './src/index.ts'; console.log(JSON.stringify(appUrl))",
      ],
      env,
      stdout: "pipe",
      stderr: "pipe",
    })

    const appUrl = JSON.parse(result.stdout.toString())

    expect(result.exitCode).toBe(0)
    expect(result.stderr.toString()).toBe("")
    expect(appUrl.origin).toBe("")
    expect(appUrl.env).toBe("production")
    expect(appUrl.isProduction).toBe(true)
  })

  test("debug is non-enumerable on resolved object", () => {
    process.env.APP_URL = "https://myapp.com"
    const mod = require("../src/index")
    const appUrl = mod.default
    // debug should not appear in JSON.stringify
    const json = JSON.parse(JSON.stringify(appUrl))
    expect(json.debug).toBeUndefined()
    // but should be accessible directly
    expect(typeof appUrl.debug).toBe("string")
  })
})

describe("createUrl({ env }) — runtime-supplied env (Cloudflare Workers, etc.)", () => {
  test("resolves APP_URL from a passed env object", () => {
    const { createUrl } = require("../src/index")
    const result = createUrl({ env: { APP_URL: "https://from-arg.example.com" } })
    expect(result.origin).toBe("https://from-arg.example.com")
  })

  test("passed env fully replaces process.env (no merge)", () => {
    process.env.APP_URL = "https://from-process.example.com"
    process.env.NODE_ENV = "development"
    const { createUrl } = require("../src/index")
    const result = createUrl({ env: { APP_URL: "https://from-arg.example.com" } })
    expect(result.origin).toBe("https://from-arg.example.com")
  })

  test("empty env object does NOT fall back to process.env", () => {
    process.env.APP_URL = "https://from-process.example.com"
    process.env.NODE_ENV = "development"
    const { createUrl } = require("../src/index")
    const result = createUrl({ env: {} })
    // No APP_URL/provider in passed env; NODE_ENV unset in passed env → localhost fallback (non-production)
    expect(result.origin).toBe("http://localhost:3000")
  })

  test("resolves APP_ENV from a passed env object", () => {
    const { createUrl } = require("../src/index")
    const result = createUrl({
      env: { APP_URL: "https://x.example.com", APP_ENV: "preview" },
    })
    expect(result.env).toBe("preview")
    expect(result.isPreview).toBe(true)
  })

  test("ignores non-string bindings (KV, DO, R2, service bindings, numbers, bools)", () => {
    const { createUrl } = require("../src/index")
    const result = createUrl({
      env: {
        APP_URL: "https://x.example.com",
        MY_KV: { get: () => null, put: () => null },
        MY_DO: class {},
        MY_R2: { put: () => null },
        MY_SERVICE: { fetch: () => null },
        SOME_NUMBER: 42,
        SOME_BOOL: true,
        SOME_NULL: null,
      },
    })
    expect(result.origin).toBe("https://x.example.com")
  })

  test("detects Vercel provider vars from passed env object", () => {
    const { createUrl } = require("../src/index")
    const result = createUrl({
      env: {
        VERCEL: "1",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "myapp.com",
      },
    })
    expect(result.origin).toBe("https://myapp.com")
    expect(result.platform).toBe("vercel")
    expect(result.env).toBe("production")
  })

  test("throws in production (passed env) when no URL detected", () => {
    const { createUrl } = require("../src/index")
    expect(() => createUrl({ env: { NODE_ENV: "production" } })).toThrow(
      "which-url: Cannot detect app URL"
    )
  })

  test("createUrl() with no argument still uses process.env", () => {
    process.env.APP_URL = "https://still-works.example.com"
    const { createUrl } = require("../src/index")
    expect(createUrl().origin).toBe("https://still-works.example.com")
  })

  test("createUrl({}) with no env key still uses process.env", () => {
    process.env.APP_URL = "https://still-works.example.com"
    const { createUrl } = require("../src/index")
    expect(createUrl({}).origin).toBe("https://still-works.example.com")
  })
})
