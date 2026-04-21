import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { resolveEnv } from "../src/env"

let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
  delete process.env.APP_ENV
  delete process.env.VERCEL
  delete process.env.VERCEL_ENV
  delete process.env.NETLIFY
  delete process.env.CONTEXT
  delete process.env.CF_PAGES
  delete process.env.RAILWAY_PUBLIC_DOMAIN
  delete process.env.RAILWAY_ENVIRONMENT
  delete process.env.FLY_APP_NAME
  delete process.env.RENDER
  delete process.env.IS_PULL_REQUEST
  delete process.env.DIGITALOCEAN_APP_PLATFORM
  delete process.env.HEROKU_APP_NAME
  process.env.NODE_ENV = "development"
})

afterEach(() => {
  process.env = savedEnv
})

describe("resolveEnv", () => {
  test("APP_ENV override takes priority", () => {
    process.env.APP_ENV = "preview"
    process.env.NODE_ENV = "production"
    expect(resolveEnv().env).toBe("preview")
  })

  test("NODE_ENV=development returns local", () => {
    process.env.NODE_ENV = "development"
    expect(resolveEnv().env).toBe("local")
  })

  test("detects Vercel environment", () => {
    process.env.NODE_ENV = "production"
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "preview"
    expect(resolveEnv().env).toBe("preview")
  })

  test("NODE_ENV=production with no provider returns production", () => {
    process.env.NODE_ENV = "production"
    expect(resolveEnv().env).toBe("production")
  })

  test("no NODE_ENV and no provider returns local", () => {
    delete process.env.NODE_ENV
    expect(resolveEnv().env).toBe("local")
  })

  test("rejects invalid APP_ENV values", () => {
    process.env.APP_ENV = "staging"
    process.env.NODE_ENV = "production"
    // Invalid APP_ENV should be ignored, fall through to NODE_ENV
    expect(resolveEnv().env).toBe("production")
  })
})
