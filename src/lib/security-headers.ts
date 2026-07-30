// Single source of truth for HTTP security headers.
// Used by the SSR entry (src/server.ts) so documents, REST routes under /api/*
// and server-function RPC calls can never drift apart.
// Keep this module dependency-free: it runs before the app is loaded.
//
// The CSP is BUILT PER ENVIRONMENT (development / staging / production) from a
// shared base, so tightening or loosening a directive never means hand-editing
// a long string in two places. Extra origins can be injected at deploy time via
// env vars (see readEnvOrigins) without touching this file at all.

export type AppEnvironment = "development" | "staging" | "production";

type Directives = Record<string, string[]>;

/** Env vars that append origins to a directive, e.g. CSP_CONNECT_SRC="https://a.com https://b.com". */
const ENV_VAR_BY_DIRECTIVE: Record<string, string> = {
  "connect-src": "CSP_CONNECT_SRC",
  "script-src": "CSP_SCRIPT_SRC",
  "style-src": "CSP_STYLE_SRC",
  "img-src": "CSP_IMG_SRC",
  "font-src": "CSP_FONT_SRC",
  "frame-src": "CSP_FRAME_SRC",
  "frame-ancestors": "CSP_FRAME_ANCESTORS",
  "media-src": "CSP_MEDIA_SRC",
};

const LOVABLE_ORIGINS = ["https://*.lovable.dev", "https://*.lovable.app"];
const SUPABASE_ORIGINS = ["https://*.supabase.co", "wss://*.supabase.co"];

/** Directives shared by every environment. */
function baseDirectives(): Directives {
  return {
    "default-src": ["'self'"],
    // Inline scripts are injected by the SSR runtime for hydration.
    "script-src": ["'self'", "'unsafe-inline'", "blob:", ...LOVABLE_ORIGINS],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "data:",
      "blob:",
      ...SUPABASE_ORIGINS,
      ...LOVABLE_ORIGINS,
      "wss://*.lovable.dev",
      "https://ai.gateway.lovable.dev",
    ],
    "media-src": ["'self'", "data:", "blob:"],
    // Allow embedding inside the Lovable editor preview iframe.
    "frame-ancestors": ["'self'", ...LOVABLE_ORIGINS],
    "frame-src": ["'self'", "https://accounts.google.com", "https://*.supabase.co"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", "https://accounts.google.com", "https://*.supabase.co"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
  };
}

/** Per-environment deltas on top of the base policy. */
const ENVIRONMENT_OVERRIDES: Record<AppEnvironment, Directives> = {
  development: {
    // Vite dev server: eval-based HMR + websocket to localhost.
    "script-src": ["'unsafe-eval'"],
    "connect-src": ["ws://localhost:*", "http://localhost:*", "ws://127.0.0.1:*"],
  },
  staging: {
    // Staging still runs inside the Lovable preview shell and is prerendered
    // by the same runtime as production, so it keeps eval for parity of bundles.
    "script-src": ["'unsafe-eval'"],
  },
  production: {
    "script-src": ["'unsafe-eval'"],
    "upgrade-insecure-requests": [],
  },
};

function readEnv(name: string): string | undefined {
  // Read at call time: on Cloudflare Workers env binds per request.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  return env?.[name]?.trim() || undefined;
}

/** Resolves the current environment from APP_ENV, falling back to NODE_ENV. */
export function detectEnvironment(): AppEnvironment {
  const raw = (readEnv("APP_ENV") ?? readEnv("NODE_ENV") ?? "development").toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "staging" || raw === "preview") return "staging";
  return "development";
}

function readEnvOrigins(directive: string): string[] {
  const varName = ENV_VAR_BY_DIRECTIVE[directive];
  if (!varName) return [];
  return (readEnv(varName) ?? "").split(/[\s,]+/).filter(Boolean);
}

function mergeUnique(...lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

/** Builds the document CSP for a given environment (defaults to the detected one). */
export function buildDocumentCsp(environment: AppEnvironment = detectEnvironment()): string {
  const directives = baseDirectives();
  const overrides = ENVIRONMENT_OVERRIDES[environment];

  for (const [directive, values] of Object.entries(overrides)) {
    directives[directive] = mergeUnique(directives[directive] ?? [], values);
  }
  for (const directive of Object.keys(directives)) {
    const extra = readEnvOrigins(directive);
    if (extra.length) directives[directive] = mergeUnique(directives[directive], extra);
  }

  return Object.entries(directives)
    .map(([directive, values]) => (values.length ? `${directive} ${values.join(" ")}` : directive))
    .join("; ");
}

/**
 * CSP for data endpoints (REST + RPC). They render nothing, so everything is
 * denied. `sandbox` is intentionally omitted: it has no meaning for a JSON
 * payload and breaks nothing, but keeping the policy minimal avoids surprises
 * if a browser ever navigates directly to an endpoint. Identical in every
 * environment — data endpoints never need extra origins.
 */
export const API_CSP = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

/** CSP for HTML documents, resolved for the environment this process runs in. */
export const DOCUMENT_CSP = buildDocumentCsp();

/** Headers applied to every response regardless of type. */
export const BASE_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

/** True for REST routes under /api/* and server-function RPC endpoints. */
export function isDataEndpoint(url: string): boolean {
  const { pathname } = new URL(url, "http://localhost");
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_serverFn")
  );
}

export function applySecurityHeaders(response: Response, request?: Request): Response {
  const contentType = response.headers.get("content-type") ?? "";
  const isHtml = contentType.includes("text/html");
  const isApi = request ? isDataEndpoint(request.url) : false;
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (isApi && !isHtml) {
    headers.set("Content-Security-Policy", API_CSP);
    headers.set("X-Frame-Options", "DENY");
    if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  } else {
    headers.set("X-Frame-Options", "SAMEORIGIN");
    // Built per request so deploy-time env overrides apply without a rebuild.
    if (isHtml) headers.set("Content-Security-Policy", buildDocumentCsp());
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
