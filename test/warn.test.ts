import { describe, test, expect } from "bun:test"
import { unresolvedWarning } from "../src/warn"

const debug = "[error] which-url: Cannot detect app URL. Set APP_URL environment variable. | env=production (NODE_ENV=production)"

describe("unresolvedWarning", () => {
  test("warns during next build, naming APP_URL and including the debug trace", () => {
    const warning = unresolvedWarning("phase-production-build", debug)
    expect(warning).toContain("`next build`")
    expect(warning).toContain("APP_URL=http://localhost:3000")
    expect(warning).toContain("whichUrl()")
    expect(warning).toEndWith(debug)
  })

  test("stays silent outside next build so tests, browsers, and edge runtimes import quietly", () => {
    expect(unresolvedWarning(undefined, debug)).toBeNull()
    expect(unresolvedWarning("phase-development-server", debug)).toBeNull()
    expect(unresolvedWarning("phase-production-server", debug)).toBeNull()
  })
})

describe("singleton import", () => {
  // A child process gets a fresh module instance and an env with no URL vars.
  const importIndex = (env: Record<string, string>) =>
    Bun.spawnSync(["bun", "-e", `await import(${JSON.stringify(`${import.meta.dir}/../src/index.ts`)})`], {
      env: { PATH: process.env.PATH ?? "", ...env },
    })

  test("warns once when it falls back during next build", () => {
    const { stderr } = importIndex({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })
    const lines = stderr.toString().split("\n").filter((l) => l.includes("[which-url]"))
    expect(lines).toHaveLength(1)
  })

  test("imports silently when it falls back outside next build", () => {
    const { stderr } = importIndex({ NODE_ENV: "production" })
    expect(stderr.toString()).not.toContain("[which-url]")
  })

  test("imports silently during next build when the URL resolves", () => {
    const { stderr } = importIndex({
      NODE_ENV: "production",
      NEXT_PHASE: "phase-production-build",
      APP_URL: "https://myapp.com",
    })
    expect(stderr.toString()).not.toContain("[which-url]")
  })
})
