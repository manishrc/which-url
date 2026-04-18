# which-url

Auto-detect your app's URL across hosting providers. Zero config.

```bash
npm install which-url
```

```typescript
import whichUrl from 'which-url'

whichUrl.href      // "https://myapp.vercel.app"
whichUrl.hostname  // "myapp.vercel.app"
```

Works on Vercel, Netlify, Cloudflare Pages, Railway, Fly.io, Render, DigitalOcean, and Heroku — automatically.

## Usage

### Named exports (plain strings — zero type friction)

```typescript
import { href, hostname, origin, isProduction } from 'which-url'

// Pass directly to any function that expects a string
process.env.BETTER_AUTH_URL = href
fetch(`${href}/api/data`)
cookie.domain = hostname

if (isProduction) {
  // production-only logic
}
```

### Default export (object with dot access)

```typescript
import whichUrl from 'which-url'

whichUrl.href        // "https://myapp.vercel.app"
whichUrl.origin      // "https://myapp.vercel.app"
whichUrl.hostname    // "myapp.vercel.app"
whichUrl.host        // "myapp.vercel.app"
whichUrl.protocol    // "https:"
whichUrl.port        // ""

whichUrl.env           // "production" | "preview" | "local"
whichUrl.isProduction  // boolean
whichUrl.isPreview     // boolean
whichUrl.isLocal       // boolean
```

Property names follow the [WHATWG URL spec](https://url.spec.whatwg.org/) — nothing new to learn.

## How it works

`which-url` reads environment variables that hosting providers set automatically. No configuration needed.

**Resolution priority:**

1. `APP_URL` env var (your override — always wins)
2. Provider auto-detection
3. `window.location.origin` (browser)
4. `http://localhost:${PORT || 3000}` (development)
5. Throws in production if nothing detected

## Provider support

| Provider | Detection | URL source |
|----------|-----------|------------|
| **Vercel** | `VERCEL` | `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_BRANCH_URL` / `VERCEL_URL` |
| **Netlify** | `NETLIFY` | `URL` / `DEPLOY_PRIME_URL` / `DEPLOY_URL` |
| **Cloudflare Pages** | `CF_PAGES` | `CF_PAGES_URL` |
| **Railway** | `RAILWAY_PUBLIC_DOMAIN` | `RAILWAY_PUBLIC_DOMAIN` |
| **Fly.io** | `FLY_APP_NAME` | `{app}.fly.dev` |
| **Render** | `RENDER` | `RENDER_EXTERNAL_URL` |
| **DigitalOcean** | `DIGITALOCEAN_APP_PLATFORM` | `APP_URL` |
| **Heroku** | `HEROKU_APP_NAME` | `{app}.herokuapp.com` |

## Override with `APP_URL`

Set `APP_URL` to override auto-detection. Useful for custom domains, tunnels, or unsupported providers.

```bash
# .env.local
APP_URL=https://myapp.com
```

`NEXT_PUBLIC_APP_URL` also works (for client-side access in Next.js).

## Local development

Zero config — auto-detects `http://localhost:3000` (or `PORT` if set).

```bash
# Custom port
APP_URL=http://localhost:4000

# Custom local domain
APP_URL=http://myapp.local:3000

# Local HTTPS (mkcert)
APP_URL=https://localhost:3000

# Tunnel
APP_URL=https://abc123.ngrok-free.app
```

For tunnels with dynamic URLs:

```bash
APP_URL=$(curl -s localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url') npm run dev
```

## Error handling

In **production**, `which-url` throws if it can't detect the URL — preventing silent misconfiguration (broken OAuth, CORS, emails pointing to localhost).

Use `createUrl` with a fallback to opt into lenient behavior:

```typescript
import { createUrl } from 'which-url'

const url = createUrl({ fallback: 'https://fallback.example.com' })
url.href // never throws
```

In **development**, it always falls back to localhost.

## Cloudflare Workers

Cloudflare Workers use runtime `env` bindings instead of `process.env`. Set `APP_URL` in `wrangler.toml`:

```toml
[vars]
APP_URL = "https://myapp.workers.dev"
```

Modern wrangler polyfills `process.env` from `[vars]`, so `which-url` picks it up automatically. Cloudflare Pages build-time env vars also work.

## Integrations

### Better Auth

```typescript
import { href } from 'which-url'
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  baseURL: href,
  // ...
})
```

### NextAuth / Auth.js

```typescript
import { href } from 'which-url'

// No need to set NEXTAUTH_URL manually
process.env.NEXTAUTH_URL = href
```

## API

### Named exports

| Export | Type | Description |
|--------|------|-------------|
| `href` | `string` | Full URL (`https://myapp.vercel.app`) |
| `origin` | `string` | Origin (`https://myapp.vercel.app`) |
| `hostname` | `string` | Hostname (`myapp.vercel.app`) |
| `host` | `string` | Host with port (`myapp.vercel.app`) |
| `protocol` | `string` | Protocol (`https:`) |
| `port` | `string` | Port (empty if default) |
| `env` | `AppEnv` | `"production"` \| `"preview"` \| `"local"` |
| `isProduction` | `boolean` | `true` if production |
| `isPreview` | `boolean` | `true` if preview/staging |
| `isLocal` | `boolean` | `true` if local development |
| `createUrl(options?)` | `function` | Create a new instance with custom options |

### `createUrl(options?)`

```typescript
createUrl({ fallback?: string }): WhichUrl
```

Re-resolves the URL from current environment. Use for:
- Custom fallbacks (never throws)
- Re-resolution in tests
- Dynamic configuration

## License

MIT
