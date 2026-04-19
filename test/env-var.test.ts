import { describe, test, expect } from "bun:test"
import { getVar } from "../src/env-var"

describe("getVar", () => {
  test("finds unprefixed value", () => {
    expect(getVar({ VERCEL_URL: "myapp.vercel.app" }, "VERCEL_URL")).toBe(
      "myapp.vercel.app"
    )
  })

  test("finds NEXT_PUBLIC_ prefixed value when unprefixed is missing", () => {
    expect(
      getVar({ NEXT_PUBLIC_VERCEL_ENV: "production" }, "VERCEL_ENV")
    ).toBe("production")
  })

  test("finds VITE_ prefixed value", () => {
    expect(
      getVar({ VITE_VERCEL_URL: "myapp-git-feat.vercel.app" }, "VERCEL_URL")
    ).toBe("myapp-git-feat.vercel.app")
  })

  test("finds PUBLIC_ prefixed value (Astro/SvelteKit)", () => {
    expect(getVar({ PUBLIC_VERCEL_ENV: "preview" }, "VERCEL_ENV")).toBe(
      "preview"
    )
  })

  test("finds NUXT_ENV_ prefixed value", () => {
    expect(
      getVar({ NUXT_ENV_APP_URL: "https://myapp.com" }, "APP_URL")
    ).toBe("https://myapp.com")
  })

  test("finds REACT_APP_ prefixed value", () => {
    expect(
      getVar({ REACT_APP_VERCEL_ENV: "production" }, "VERCEL_ENV")
    ).toBe("production")
  })

  test("finds GATSBY_ prefixed value", () => {
    expect(getVar({ GATSBY_APP_URL: "https://myapp.com" }, "APP_URL")).toBe(
      "https://myapp.com"
    )
  })

  test("finds VUE_APP_ prefixed value", () => {
    expect(getVar({ VUE_APP_VERCEL_URL: "myapp.vercel.app" }, "VERCEL_URL")).toBe(
      "myapp.vercel.app"
    )
  })

  test("finds REDWOOD_ENV_ prefixed value", () => {
    expect(
      getVar({ REDWOOD_ENV_APP_URL: "https://myapp.com" }, "APP_URL")
    ).toBe("https://myapp.com")
  })

  test("finds SANITY_STUDIO_ prefixed value", () => {
    expect(
      getVar({ SANITY_STUDIO_VERCEL_ENV: "production" }, "VERCEL_ENV")
    ).toBe("production")
  })

  test("unprefixed takes priority when both exist", () => {
    expect(
      getVar(
        {
          VERCEL_URL: "server.vercel.app",
          NEXT_PUBLIC_VERCEL_URL: "client.vercel.app",
        },
        "VERCEL_URL"
      )
    ).toBe("server.vercel.app")
  })

  test("returns undefined when no prefix matches", () => {
    expect(getVar({}, "VERCEL_URL")).toBeUndefined()
  })

  test("skips empty string values", () => {
    expect(
      getVar(
        { VERCEL_URL: "", NEXT_PUBLIC_VERCEL_URL: "client.vercel.app" },
        "VERCEL_URL"
      )
    ).toBe("client.vercel.app")
  })
})
