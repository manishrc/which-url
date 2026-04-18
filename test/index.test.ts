import { describe, test, expect, beforeEach, afterEach } from "bun:test"

let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
})

afterEach(() => {
  process.env = savedEnv
})

describe("which-url public API", () => {
  test("default export is an object with WHATWG URL properties", async () => {
    process.env.APP_URL = "https://myapp.vercel.app"
    // Dynamic import to pick up env changes
    const mod = await import("../src/index")
    const thisApp = mod.createUrl()

    expect(thisApp.href).toBe("https://myapp.vercel.app")
    expect(thisApp.origin).toBe("https://myapp.vercel.app")
    expect(thisApp.hostname).toBe("myapp.vercel.app")
    expect(thisApp.host).toBe("myapp.vercel.app")
    expect(thisApp.protocol).toBe("https:")
    expect(thisApp.port).toBe("")
  })

  test("default export has env helpers", async () => {
    process.env.APP_URL = "https://myapp.vercel.app"
    process.env.VERCEL = "1"
    process.env.VERCEL_ENV = "preview"
    const mod = await import("../src/index")
    const thisApp = mod.createUrl()

    expect(thisApp.env).toBe("preview")
    expect(thisApp.isProduction).toBe(false)
    expect(thisApp.isPreview).toBe(true)
    expect(thisApp.isLocal).toBe(false)
  })

  test("createUrl with fallback never throws in production", async () => {
    process.env.NODE_ENV = "production"
    delete process.env.APP_URL
    delete process.env.VERCEL
    const mod = await import("../src/index")

    expect(() =>
      mod.createUrl({ fallback: "https://fallback.example.com" })
    ).not.toThrow()

    const result = mod.createUrl({ fallback: "https://fallback.example.com" })
    expect(result.href).toBe("https://fallback.example.com")
  })

  test("createUrl with localhost port", async () => {
    process.env.NODE_ENV = "development"
    process.env.PORT = "4567"
    delete process.env.APP_URL
    delete process.env.VERCEL
    const mod = await import("../src/index")
    const result = mod.createUrl()

    expect(result.href).toBe("http://localhost:4567")
    expect(result.hostname).toBe("localhost")
    expect(result.port).toBe("4567")
    expect(result.protocol).toBe("http:")
  })

  test("named exports are plain strings and booleans", async () => {
    process.env.APP_URL = "https://myapp.vercel.app"
    process.env.NODE_ENV = "development"
    const mod = await import("../src/index")
    const thisApp = mod.createUrl()

    // Verify types at runtime — these should be primitives
    expect(typeof thisApp.href).toBe("string")
    expect(typeof thisApp.hostname).toBe("string")
    expect(typeof thisApp.isProduction).toBe("boolean")
    expect(typeof thisApp.isPreview).toBe("boolean")
    expect(typeof thisApp.isLocal).toBe("boolean")
  })
})
