import appUrl, { whichUrl, createUrl, origin, type AppEnv, type WhichUrl, type ResolvedWhichUrl } from "../../src/index"

interface Request {
  url: string
}

declare const Response: {
  json(value: unknown): Response
}

interface Env {
  APP_URL: string
  APP_ENV: string
  MY_KV: {
    get(key: string): Promise<string | null>
  }
}

declare const env: Env

const fromWorkerEnv = whichUrl({ env })
const fromProcessEnv = whichUrl({ env: process.env })
const fromDefaultEnv = whichUrl()
const fromDeprecatedAlias: ResolvedWhichUrl = createUrl({ env })

const appOrigin: string = fromWorkerEnv.origin
const appEnv: AppEnv = fromWorkerEnv.env
const union: WhichUrl = fromWorkerEnv
const defaultOrigin: string = appUrl.origin
const namedOrigin: string = origin

// `isResolved` is a discriminant — narrowing works on the union.
const narrowed: string = appUrl.isResolved ? appUrl.allowedOrigins[0] : appUrl.origin
const emptyOnFallback: "" = appUrl.isResolved ? "" : appUrl.origin
const productionOnFallback: undefined = appUrl.isResolved ? undefined : appUrl.productionOrigin

export default {
  fetch(_request: Request, workerEnv: Env) {
    const workerUrl = whichUrl({ env: workerEnv })

    return Response.json({
      origin: workerUrl.origin,
      env: workerUrl.env,
      processOrigin: fromProcessEnv.origin,
      defaultOrigin: fromDefaultEnv.origin,
      appOrigin,
      appEnv,
      debug: union.debug,
      aliasOrigin: fromDeprecatedAlias.origin,
      singletonOrigin: defaultOrigin,
      namedOrigin,
      narrowed,
      emptyOnFallback,
      productionOnFallback,
    })
  },
}
