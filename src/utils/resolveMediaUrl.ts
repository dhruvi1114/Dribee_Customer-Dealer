import { API_BASE_URL } from '@/utils/constants/api.constant';

/** Protocol + host + port only — never include `/api/v1` etc. (static `/uploads` lives on app root). */
function getServerOrigin(): string {
  const raw = String(API_BASE_URL).trim().replace(/\/$/, '');
  try {
    return new URL(raw).origin;
  } catch {
    const m = raw.match(/^(https?:\/\/[^/?#]+)/i);
    if (m) return m[1];
    return raw;
  }
}

/**
 * Makes catalogue / variant image URLs load in the mobile app.
 * - Relative paths (`/uploads/...`) are prefixed with the **server origin** (host + port), not
 *   the full `API_BASE_URL` path, so `/uploads/...` resolves to `http://host:port/uploads/...`
 *   instead of wrongly nesting under `/api/v1/uploads/...`.
 * - `http://localhost` / `127.0.0.1` (common after admin upload in dev) are rewritten to
 *   the same host/port as `API_BASE_URL` so a device or emulator can reach your machine.
 */
export function resolveMediaUrl(uri: string | null | undefined): string | null {
  if (uri == null) return null;
  const s = String(uri).trim();
  if (!s) return null;

  const apiOrigin = getServerOrigin();
  let apiProtocol = 'http:';
  let apiHost = '';
  let apiPort = '';
  try {
    const api = new URL(API_BASE_URL);
    apiProtocol = api.protocol;
    apiHost = api.hostname;
    apiPort = api.port;
  } catch {
    const m = apiOrigin.match(/^(https?):\/\/([^/:]+)(?::(\d+))?/i);
    if (m) {
      apiProtocol = `${m[1].toLowerCase()}:`;
      apiHost = m[2];
      apiPort = m[3] ?? '';
    }
  }

  if (s.startsWith('//')) {
    try {
      const { protocol } = new URL(API_BASE_URL);
      return `${protocol}${s}`;
    } catch {
      return `https:${s}`;
    }
  }

  if (s.startsWith('/')) {
    return `${apiOrigin}${s}`;
  }

  // Some APIs return "uploads/..." (without a leading slash).
  if (s.startsWith('uploads/')) {
    return `${apiOrigin}/${s}`;
  }

  // RN runtime can be inconsistent with URL parsing in some builds; keep a
  // string-prefix fallback so localhost media is always rewritten for devices.
  if ((s.startsWith('http://localhost') || s.startsWith('https://localhost')) && apiHost) {
    const path = s.replace(/^https?:\/\/localhost(?::\d+)?/i, '');
    const port = apiPort ? `:${apiPort}` : '';
    return `${apiProtocol}//${apiHost}${port}${path}`;
  }
  if ((s.startsWith('http://127.0.0.1') || s.startsWith('https://127.0.0.1')) && apiHost) {
    const path = s.replace(/^https?:\/\/127\.0\.0\.1(?::\d+)?/i, '');
    const port = apiPort ? `:${apiPort}` : '';
    return `${apiProtocol}//${apiHost}${port}${path}`;
  }

  try {
    const u = new URL(s);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      const api = new URL(API_BASE_URL);
      const port = api.port ? `:${api.port}` : '';
      return `${api.protocol}//${api.hostname}${port}${u.pathname}${u.search}`;
    }
    return s;
  } catch {
    return s;
  }
}

export function resolveMediaUrls(uris: string[] | null | undefined): string[] {
  if (!uris?.length) return [];
  return uris.map((u) => resolveMediaUrl(u)).filter((u): u is string => u !== null);
}
