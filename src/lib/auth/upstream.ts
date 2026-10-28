type CachedToken = {
  token: string;
  expiresAtMs: number;
};

let cached: CachedToken | null = null;
let inflight: Promise<string> | null = null;

const REFRESH_BUFFER_MS = 10 * 60 * 1000;
const FALLBACK_TTL_MS = 55 * 60 * 1000;

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://eu-law.deputeti.ai";
  if (baseUrl.includes("#")) {
    baseUrl = baseUrl.split("#")[0];
  }
  return baseUrl.replace(/\/$/, "");
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function loginUpstream(): Promise<string> {
  const username = process.env.UPSTREAM_API_USERNAME?.trim();
  const password = process.env.UPSTREAM_API_PASSWORD?.trim();

  if (!username || !password) {
    throw new Error("UPSTREAM_API_USERNAME and UPSTREAM_API_PASSWORD must be set.");
  }

  const backendUrl = `${getBackendBaseUrl()}/api/v1/auth/login`;
  const upstream = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    throw new Error(`Upstream login failed (${upstream.status}).`);
  }

  let parsed: { access_token?: string; token?: string } = {};
  try {
    parsed = JSON.parse(text) as { access_token?: string; token?: string };
  } catch {
    throw new Error("Invalid upstream login response.");
  }

  const token = parsed.access_token || parsed.token;
  if (!token) {
    throw new Error("Upstream login response missing token.");
  }

  const exp = getJwtExpiryMs(token);
  cached = {
    token,
    expiresAtMs: exp ?? Date.now() + FALLBACK_TTL_MS,
  };

  return token;
}

export async function getUpstreamAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cached && cached.expiresAtMs - Date.now() > REFRESH_BUFFER_MS) {
    return cached.token;
  }

  if (!forceRefresh && inflight) {
    return inflight;
  }

  inflight = loginUpstream().finally(() => {
    inflight = null;
  });

  return inflight;
}

export async function getUpstreamAuthHeader(forceRefresh = false): Promise<string> {
  const token = await getUpstreamAccessToken(forceRefresh);
  return `Bearer ${token}`;
}
