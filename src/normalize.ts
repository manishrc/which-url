export function normalizeUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "")
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return `https://${url}`
}
