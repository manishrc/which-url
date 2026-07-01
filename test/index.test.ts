import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { resolveUrl } from "../src/resolve"
import { resolveEnv } from "../src/env"

let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
  delete process.env.APP_URL
  delete process.env.APP_PRODUCTION_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.NEXT_PUBLIC_APP_PRODUCTION_URL
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

  test("whichUrl exposes productionOrigin from explicit production URL", () => {
    process.env.APP_URL = "http://localhost:3000"
    process.env.APP_PRODUCTION_URL = "https://myapp.com"
    const { whichUrl } = require("../src/index")

    const appUrl = whichUrl()
    expect(appUrl.origin).toBe("http://localhost:3000")
    expect(appUrl.productionOrigin).toBe("https://myapp.com")
  })

  test("whichUrl exposes productionOrigin from Vercel preview env", () => {
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "preview"
    process.env.VERCEL_BRANCH_URL = "myapp-git-feature.vercel.app"
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.com"
    const { whichUrl } = require("../src/index")

    const appUrl = whichUrl()
    expect(appUrl.origin).toBe("https://myapp-git-feature.vercel.app")
    expect(appUrl.productionOrigin).toBe("https://myapp.com")
  })

  test("whichUrl exposes unresolved productionOrigin as undefined", () => {
    process.env.APP_URL = "http://localhost:3000"
    const { whichUrl } = require("../src/index")

    const appUrl = whichUrl()
    expect(appUrl.origin).toBe("http://localhost:3000")
    expect(appUrl.productionOrigin).toBeUndefined()
    expect(appUrl.isResolved).toBe(true)
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

  test("whichUrl resolves fresh environment values", () => {
    process.env.APP_URL = "https://fresh.example.com"
    const { whichUrl } = require("../src/index")

    expect(whichUrl().origin).toBe("https://fresh.example.com")
  })

  test("whichUrl throws when production URL cannot be resolved", () => {
    process.env.NODE_ENV = "production"
    const { whichUrl } = require("../src/index")

    expect(() => whichUrl()).toThrow("which-url: Cannot detect app URL")
  })

  test("default import stays quiet and best-effort when production URL cannot be resolved", () => {
    const env = { ...process.env, NODE_ENV: "production" }
    delete env.APP_URL
    delete env.APP_PRODUCTION_URL
    delete env.NEXT_PUBLIC_APP_URL
    delete env.NEXT_PUBLIC_APP_PRODUCTION_URL
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
    expect(appUrl.productionOrigin).toBeUndefined()
    expect(appUrl.env).toBe("production")
    expect(appUrl.isResolved).toBe(false)
    expect(appUrl.isProduction).toBe(true)
  })

  test("createUrl is a deprecated alias of whichUrl", () => {
    const mod = require("../src/index")
    expect(mod.createUrl).toBe(mod.whichUrl)
  })

  test("href is no longer exported", () => {
    const mod = require("../src/index")
    expect(mod.href).toBeUndefined()
    expect("href" in mod.default).toBe(false)
    expect("href" in mod.whichUrl({ env: { APP_URL: "https://myapp.com" } })).toBe(false)
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

describe("allowedOrigins / allowedHostnames allow-list", () => {
  test("portless multi-hostname dev: all portless URLs + localhost, primary first", () => {
    process.env.PORTLESS_URL = "https://myapp.localhost"
    process.env.PORTLESS_TAILSCALE_URL = "https://myapp.tail1234.ts.net"
    process.env.PORT = "52341"
    const { whichUrl } = require("../src/index")

    const appUrl = whichUrl()
    expect(appUrl.origin).toBe("https://myapp.tail1234.ts.net")
    expect(appUrl.allowedOrigins).toEqual([
      "https://myapp.tail1234.ts.net",
      "https://myapp.localhost",
      "http://localhost:52341",
    ])
    expect(appUrl.allowedHostnames).toEqual([
      "myapp.tail1234.ts.net",
      "myapp.localhost",
      "localhost",
    ])
    delete process.env.PORT
  })

  test("portless with ngrok included", () => {
    process.env.PORTLESS_URL = "https://myapp.localhost"
    process.env.PORTLESS_NGROK_URL = "https://abc123.ngrok-free.app"
    const { whichUrl } = require("../src/index")

    expect(whichUrl().allowedOrigins).toEqual([
      "https://abc123.ngrok-free.app",
      "https://myapp.localhost",
      "http://localhost:3000",
    ])
  })

  test("Vercel preview: branch URL, production domain, deployment URL — deduped", () => {
    const { whichUrl } = require("../src/index")
    const appUrl = whichUrl({
      env: {
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_URL: "myapp-abc123.vercel.app",
        VERCEL_BRANCH_URL: "myapp-git-feat.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "myapp.com",
      },
    })
    expect(appUrl.allowedOrigins).toEqual([
      "https://myapp-git-feat.vercel.app",
      "https://myapp.com",
      "https://myapp-abc123.vercel.app",
    ])
    expect(appUrl.allowedHostnames).toContain("myapp.com")
  })

  test("plain local dev: single localhost origin, no duplicates", () => {
    const { whichUrl } = require("../src/index")
    const appUrl = whichUrl({ env: { NODE_ENV: "development", PORT: "4000" } })
    expect(appUrl.allowedOrigins).toEqual(["http://localhost:4000"])
    expect(appUrl.allowedHostnames).toEqual(["localhost"])
  })

  test("production via APP_URL: no localhost in the list", () => {
    const { whichUrl } = require("../src/index")
    const appUrl = whichUrl({
      env: { APP_URL: "https://myapp.com", NODE_ENV: "production" },
    })
    expect(appUrl.allowedOrigins).toEqual(["https://myapp.com"])
  })

  test("unresolved fallback exposes empty lists", () => {
    const env = { ...process.env, NODE_ENV: "production" }
    delete env.APP_URL
    delete env.NEXT_PUBLIC_APP_URL
    delete env.VERCEL
    delete env.VERCEL_ENV
    delete env.VERCEL_URL

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
    expect(appUrl.allowedOrigins).toEqual([])
    expect(appUrl.allowedHostnames).toEqual([])
  })

  test("portless PORTLESS_TAILSCALE_URL without protocol is normalized in origins", () => {
    const { whichUrl } = require("../src/index")
    const appUrl = whichUrl({
      env: { NODE_ENV: "development", PORTLESS_URL: "myapp.localhost" },
    })
    expect(appUrl.allowedOrigins).toContain("https://myapp.localhost")
  })
})

describe("whichUrl({ env }) — runtime-supplied env (Cloudflare Workers, etc.)", () => {
  test("resolves APP_URL from a passed env object", () => {
    const { whichUrl } = require("../src/index")
    const result = whichUrl({ env: { APP_URL: "https://from-arg.example.com" } })
    expect(result.origin).toBe("https://from-arg.example.com")
  })

  test("passed env fully replaces process.env (no merge)", () => {
    process.env.APP_URL = "https://from-process.example.com"
    process.env.NODE_ENV = "development"
    const { whichUrl } = require("../src/index")
    const result = whichUrl({ env: { APP_URL: "https://from-arg.example.com" } })
    expect(result.origin).toBe("https://from-arg.example.com")
  })

  test("empty env object does NOT fall back to process.env", () => {
    process.env.APP_URL = "https://from-process.example.com"
    process.env.NODE_ENV = "development"
    const { whichUrl } = require("../src/index")
    const result = whichUrl({ env: {} })
    // No APP_URL/provider in passed env; NODE_ENV unset in passed env → localhost fallback (non-production)
    expect(result.origin).toBe("http://localhost:3000")
  })

  test("resolves APP_ENV from a passed env object", () => {
    const { whichUrl } = require("../src/index")
    const result = whichUrl({
      env: { APP_URL: "https://x.example.com", APP_ENV: "preview" },
    })
    expect(result.env).toBe("preview")
    expect(result.isPreview).toBe(true)
  })

  test("ignores non-string bindings (KV, DO, R2, service bindings, numbers, bools)", () => {
    const { whichUrl } = require("../src/index")
    const result = whichUrl({
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
    const { whichUrl } = require("../src/index")
    const result = whichUrl({
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
    const { whichUrl } = require("../src/index")
    expect(() => whichUrl({ env: { NODE_ENV: "production" } })).toThrow(
      "which-url: Cannot detect app URL"
    )
  })

  test("whichUrl() with no argument still uses process.env", () => {
    process.env.APP_URL = "https://still-works.example.com"
    const { whichUrl } = require("../src/index")
    expect(whichUrl().origin).toBe("https://still-works.example.com")
  })

  test("whichUrl({}) with no env key still uses process.env", () => {
    process.env.APP_URL = "https://still-works.example.com"
    const { whichUrl } = require("../src/index")
    expect(whichUrl({}).origin).toBe("https://still-works.example.com")
  })
})
