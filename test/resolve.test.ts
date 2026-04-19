import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { resolveUrl } from "../src/resolve"

// Save and restore process.env between tests
let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
  // Clear all provider env vars
  delete process.env.APP_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.VERCEL
  delete process.env.VERCEL_ENV
  delete process.env.VERCEL_URL
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  delete process.env.VERCEL_BRANCH_URL
  delete process.env.NETLIFY
  delete process.env.CF_PAGES
  delete process.env.RAILWAY_PUBLIC_DOMAIN
  delete process.env.FLY_APP_NAME
  delete process.env.RENDER
  delete process.env.RENDER_EXTERNAL_URL
  delete process.env.DIGITALOCEAN_APP_PLATFORM
  delete process.env.HEROKU_APP_NAME
  delete process.env.PORT
  // Framework-prefixed vars
  delete process.env.VITE_APP_URL
  delete process.env.PUBLIC_APP_URL
  delete process.env.NUXT_ENV_APP_URL
  delete process.env.NEXT_PUBLIC_VERCEL_ENV
  delete process.env.VITE_VERCEL_ENV
  delete process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  delete process.env.VITE_VERCEL_BRANCH_URL
  // Default to non-production for safety
  process.env.NODE_ENV = "development"
})

afterEach(() => {
  process.env = savedEnv
})

describe("resolveUrl", () => {
  test("APP_URL override takes top priority", () => {
    process.env.APP_URL = "https://custom.example.com"
    process.env.VERCEL = "1"
    process.env.VERCEL_URL = "myapp.vercel.app"
    expect(resolveUrl()).toBe("https://custom.example.com")
  })

  test("NEXT_PUBLIC_APP_URL override works", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://next-custom.example.com"
    expect(resolveUrl()).toBe("https://next-custom.example.com")
  })

  test("APP_URL takes priority over NEXT_PUBLIC_APP_URL", () => {
    process.env.APP_URL = "https://app.example.com"
    process.env.NEXT_PUBLIC_APP_URL = "https://next.example.com"
    expect(resolveUrl()).toBe("https://app.example.com")
  })

  test("detects Vercel provider URL", () => {
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "preview"
    process.env.VERCEL_URL = "myapp-abc123.vercel.app"
    expect(resolveUrl()).toBe("https://myapp-abc123.vercel.app")
  })

  test("falls back to localhost in development", () => {
    process.env.NODE_ENV = "development"
    expect(resolveUrl()).toBe("http://localhost:3000")
  })

  test("uses PORT env var for localhost fallback", () => {
    process.env.NODE_ENV = "development"
    process.env.PORT = "4000"
    expect(resolveUrl()).toBe("http://localhost:4000")
  })

  test("throws in production when no URL detected", () => {
    process.env.NODE_ENV = "production"
    expect(() => resolveUrl()).toThrow("which-url: Cannot detect app URL")
  })

  test("does not throw in production when fallback provided", () => {
    process.env.NODE_ENV = "production"
    expect(resolveUrl({ fallback: "https://fallback.example.com" })).toBe(
      "https://fallback.example.com"
    )
  })

  test("normalizes bare hostnames from providers", () => {
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "production"
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.com"
    expect(resolveUrl()).toBe("https://myapp.com")
  })

  test("strips trailing slash from APP_URL", () => {
    process.env.APP_URL = "https://custom.example.com/"
    expect(resolveUrl()).toBe("https://custom.example.com")
  })

  test("VITE_APP_URL override works", () => {
    process.env.VITE_APP_URL = "https://vite-app.example.com"
    expect(resolveUrl()).toBe("https://vite-app.example.com")
  })

  test("PUBLIC_APP_URL override works (Astro)", () => {
    process.env.PUBLIC_APP_URL = "https://astro-app.example.com"
    expect(resolveUrl()).toBe("https://astro-app.example.com")
  })

  test("NUXT_ENV_APP_URL override works", () => {
    process.env.NUXT_ENV_APP_URL = "https://nuxt-app.example.com"
    expect(resolveUrl()).toBe("https://nuxt-app.example.com")
  })

  test("detects Vercel from NEXT_PUBLIC_VERCEL_ENV on client", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production"
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL = "myapp.com"
    expect(resolveUrl()).toBe("https://myapp.com")
  })

  test("detects Vercel from VITE_VERCEL_ENV on client", () => {
    process.env.VITE_VERCEL_ENV = "preview"
    process.env.VITE_VERCEL_BRANCH_URL = "myapp-git-feat.vercel.app"
    expect(resolveUrl()).toBe("https://myapp-git-feat.vercel.app")
  })
})
