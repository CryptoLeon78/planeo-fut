// Single source of truth for HTTP security headers.
// Used by the SSR entry (src/server.ts) so documents, REST routes under /api/*
// and server-function RPC calls can never drift apart.
// Keep this module dependency-free: it runs before the app is loaded.

/** CSP for HTML documents rendered by SSR. */
export const DOCUMENT_CSP = [
  "default-src 'self'",
  // React/TanStack hydration + Vite dev; inline scripts injected by the SSR runtime.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.lovable.dev https://*.lovable.app",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co https://*.lovable.dev wss://*.lovable.dev https://*.lovable.app https://ai.gateway.lovable.dev",
  "media-src 'self' data: blob:",
  // Allow embedding inside the Lovable editor preview iframe.
  "frame-ancestors 'self' https://*.lovable.dev https://*.lovable.app",
  "frame-src 'self' https://accounts.google.com https://*.supabase.co",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://*.supabase.co",
  "object-src 'none'",
  "worker-src 'self' blob:",
].join("; ");

/**
 * CSP for data endpoints (REST + RPC). They render nothing, so everything is
 * denied. `sandbox` is intentionally omitted: it has no meaning for a JSON
 * payload and breaks nothing, but keeping the policy minimal avoids surprises
 * if a browser ever navigates directly to an endpoint.
 */
export const API_CSP = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

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
    if (isHtml) headers.set("Content-Security-Policy", DOCUMENT_CSP);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
