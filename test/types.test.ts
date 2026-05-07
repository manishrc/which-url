import { describe, expect, test } from "bun:test"
import * as ts from "typescript"

describe("public types", () => {
  test("consumer-facing API works without casts or index signatures", () => {
    const program = ts.createProgram(["test/fixtures/cloudflare-worker-env.ts"], {
      noEmit: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
      types: ["node"],
      skipLibCheck: true,
    })
    const diagnostics = ts.getPreEmitDiagnostics(program)
    const formatted = diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n")

    expect(formatted).toBe("")
  })
})
