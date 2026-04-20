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
    expect(resolveEnv()).toBe("preview")
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

  test("source is override when APP_URL is set", () => {
    process.env.APP_URL = "https://myapp.com"
    const { source } = resolveUrl()
    expect(source).toBe("override")
  })

  test("source is provider when detected from platform", () => {
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "production"
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.com"
    const { source } = resolveUrl()
    expect(source).toBe("provider")
  })

  test("source is fallback in development", () => {
    process.env.NODE_ENV = "development"
    const { source } = resolveUrl()
    expect(source).toBe("fallback")
  })
})
