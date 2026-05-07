import appUrl, { createUrl, origin, type AppEnv, type WhichUrlWithDebug } from "../../src/index"

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

const fromWorkerEnv = createUrl({ env })
const fromProcessEnv = createUrl({ env: process.env })
const fromDefaultEnv = createUrl()

const appOrigin: string = fromWorkerEnv.origin
const appEnv: AppEnv = fromWorkerEnv.env
const withDebug: WhichUrlWithDebug = fromWorkerEnv
const defaultOrigin: string = appUrl.origin
const namedOrigin: string = origin

export default {
  fetch(_request: Request, workerEnv: Env) {
    const workerUrl = createUrl({ env: workerEnv })

    return Response.json({
      origin: workerUrl.origin,
      env: workerUrl.env,
      processOrigin: fromProcessEnv.origin,
      defaultOrigin: fromDefaultEnv.origin,
      appOrigin,
      appEnv,
      debug: withDebug.debug,
      singletonOrigin: defaultOrigin,
      namedOrigin,
    })
  },
}
