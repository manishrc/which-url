# which-url

Auto-detect your app's URL across hosting providers. Zero config.

```bash
npm install which-url
```

```typescript
import { origin } from 'which-url'

auth({ baseURL: origin })
fetch(`${origin}/api/data`)
```

```
              origin                                env
Local         http://localhost:3000                  "local"
Preview       https://myapp-git-feat.vercel.app     "preview"
Production    https://myapp.com                     "production"
```

Works across environments (local, preview, production), runtimes (server, client, edge), and [platforms](#platform-support).

The default export gives you everything as an object:

```typescript
import appUrl from 'which-url'

appUrl.origin       // "https://myapp.com"
appUrl.hostname     // "myapp.com"
appUrl.protocol     // "https:"
appUrl.env          // "production"
appUrl.platform     // "vercel"
appUrl.isProduction // true
```

## The problem

Your app's base URL shows up everywhere — OAuth callbacks, API calls, CORS, emails. Every one of these breaks if the URL is wrong:

```typescript
// Auth — needs the exact URL for OAuth redirects
auth({ baseURL: ??? })

// API calls from the client
fetch(`${???}/api/data`)

// Emails — links need to point somewhere real
`Click here to verify: ${???}/verify?token=${token}`

// CORS — needs to know its own origin
cors({ origin: ??? })
```

Most teams end up with a helper that grows over time:

```typescript
// lib/url.ts — every team has one of these
function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// But wait — VERCEL_URL is the deployment URL, not your domain.
// And it doesn't work on the client. So you add more:
const baseUrl =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`

// And then Netlify uses different env vars. And Cloudflare uses different ones.
// And someone forgets the https://. And preview URLs break in production...
```

## How it works

Reads environment variables that hosting providers set automatically:

1. `APP_URL` env var (your override — always wins)
2. Provider auto-detection (Vercel, Netlify, etc.)
3. `window.location.origin` (browser fallback)
4. `http://localhost:${PORT || 3000}` (development fallback)

If nothing is detected in production, the singleton logs a warning and returns empty strings. Call `createUrl()` directly if you want it to throw instead.

## Override with `APP_URL`

Set `APP_URL` when auto-detection isn't enough — custom domains, tunnels, or unsupported providers:

```bash
# .env.local
APP_URL=https://myapp.com
```

Works with or without protocol (`APP_URL=myapp.com` → `https://myapp.com`).

**Client-side frameworks:** All framework prefixes are supported automatically — `NEXT_PUBLIC_APP_URL`, `VITE_APP_URL`, `PUBLIC_APP_URL`, `NUXT_ENV_APP_URL`, etc.

## Platform support

| Platform | Detection | URL source | Verified |
|----------|-----------|------------|:--------:|
| **Vercel** | `VERCEL` | `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_BRANCH_URL` / `VERCEL_URL` | [x] |
| **Netlify** | `NETLIFY` | `URL` / `DEPLOY_PRIME_URL` / `DEPLOY_URL` | [ ] |
| **Cloudflare Pages** | `CF_PAGES` | `CF_PAGES_URL` | [ ] |
| **Railway** | `RAILWAY_PUBLIC_DOMAIN` | `RAILWAY_PUBLIC_DOMAIN` | [ ] |
| **Fly.io** | `FLY_APP_NAME` | `{app}.fly.dev` | [ ] |
| **Render** | `RENDER` | `RENDER_EXTERNAL_URL` | [ ] |
| **DigitalOcean** | `DIGITALOCEAN_APP_PLATFORM` | `APP_URL` | [ ] |
| **Heroku** | `HEROKU_APP_NAME` | `{app}.herokuapp.com` | [ ] |

On the client, Vercel's framework-prefixed env vars (`NEXT_PUBLIC_VERCEL_URL`, `VITE_VERCEL_URL`, etc.) are detected automatically.

**Help us verify:** If you're using one of these providers, [open an issue](https://github.com/manishrc/which-url/issues) with the output of `import appUrl from 'which-url'; console.log(appUrl)` from your deployment. We'll mark it as verified.

## Examples

```typescript
import { origin, hostname, isProduction } from 'which-url'

// Better Auth
betterAuth({ baseURL: origin })

// API calls
fetch(`${origin}/api/data`)

// CORS
cors({ origin })

// Cookies
cookie.domain = hostname

// Environment checks
if (isProduction) {
  enableAnalytics()
}
```

## Gotchas

### Vercel: Redeploy after assigning a custom domain

Framework-prefixed env vars like `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` are inlined into the bundle at **build time** — the bundler replaces references with their literal values. If you assign a custom domain after deploying, the old deployment still has the previous URL baked in. Trigger a new deployment for the updated domain to take effect.

## Advanced

### Portless

Zero config — [portless](https://portless.sh) sets `PORTLESS_URL` and `which-url` picks it up automatically.

```json
"dev": "portless run next dev"
```

```
origin → https://myapp.localhost
```

### Tunnels (ngrok, Cloudflare Tunnel)

Tunnel URLs can't be auto-detected — they're external to the app process. Set `APP_URL`:

```bash
APP_URL=https://abc123.ngrok-free.app npm run dev
```

### Cloudflare Workers

Cloudflare Workers use runtime `env` bindings instead of `process.env`. Set `APP_URL` in `wrangler.toml`:

```toml
[vars]
APP_URL = "https://myapp.workers.dev"
```

Modern wrangler polyfills `process.env` from `[vars]`, so `which-url` picks it up automatically.

### Debugging

```typescript
import appUrl from 'which-url'

console.log(appUrl.debug)
// "[provider:vercel] url=myapp.com | env=production (vercel:production)"
// "[override] APP_URL=https://custom.com | env=production (NODE_ENV=production)"
// "[portless] PORTLESS_URL=https://myapp.localhost | env=local (NODE_ENV=development)"
// "[fallback] PORT=3004 | env=local (NODE_ENV=development)"
```

## API

### Default export

An object with URL properties and environment helpers.

### Named exports

| Export | Type | Example |
|--------|------|---------|
| `origin` | `string` | `"https://myapp.vercel.app"` |
| `hostname` | `string` | `"myapp.vercel.app"` |
| `host` | `string` | `"myapp.vercel.app"` or `"localhost:3000"` |
| `href` | `string` | Same as `origin` |
| `protocol` | `string` | `"https:"` |
| `port` | `string` | `""` or `"3000"` |
| `env` | `AppEnv` | `"production"` \| `"preview"` \| `"local"` |
| `platform` | `Platform` | `"vercel"` \| `"netlify"` \| ... \| `null` |
| `debug`* | `string` | `"[provider:vercel] url=myapp.com \| env=production (vercel:production)"` |

\* `debug` is non-enumerable — excluded from `JSON.stringify` to avoid React hydration mismatches. Access via `appUrl.debug`.
| `isProduction` | `boolean` | |
| `isPreview` | `boolean` | |
| `isLocal` | `boolean` | |

## License

MIT
