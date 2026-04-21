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
