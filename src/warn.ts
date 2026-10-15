/**
 * The warning to print when the import-safe singleton fell back to empty
 * strings, or `null` when silence is right.
 *
 * Silence is the default: tests, browser bundles, and edge runtimes that pass
 * env per request (`whichUrl({ env })`) all import the singleton unresolved on
 * purpose. `next build` is the exception. Its prerender workers run with
 * `NODE_ENV=production`, so an unconfigured local build always falls back, and
 * the empty `origin` then surfaces far away as `Invalid URL: /path` from
 * whatever library received `${origin}/path`.
 */
export function unresolvedWarning(nextPhase: string | undefined, debug: string): string | null {
  if (nextPhase !== "phase-production-build") return null
  return (
    `[which-url] No app URL detected during \`next build\`, so \`origin\` and the other ` +
    `singleton exports are "" (isResolved: false) and URLs built from them come out relative. ` +
    `Set APP_URL (for a local build: APP_URL=http://localhost:3000), or call whichUrl() ` +
    `where a missing URL should throw. ${debug}`
  )
}
