import { describe, test, expect } from "bun:test"
import { normalizeUrl } from "../src/normalize"

describe("normalizeUrl", () => {
  test("adds https:// to a bare hostname", () => {
    expect(normalizeUrl("myapp.vercel.app")).toBe("https://myapp.vercel.app")
  })

  test("preserves existing https://", () => {
    expect(normalizeUrl("https://myapp.vercel.app")).toBe("https://myapp.vercel.app")
  })

  test("preserves existing http://", () => {
    expect(normalizeUrl("http://localhost:3000")).toBe("http://localhost:3000")
  })

  test("strips trailing slash", () => {
    expect(normalizeUrl("https://myapp.vercel.app/")).toBe("https://myapp.vercel.app")
  })

  test("strips multiple trailing slashes", () => {
    expect(normalizeUrl("myapp.vercel.app///")).toBe("https://myapp.vercel.app")
  })

  test("trims whitespace", () => {
    expect(normalizeUrl("  myapp.vercel.app  ")).toBe("https://myapp.vercel.app")
  })
})
