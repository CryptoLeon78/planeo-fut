import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const CSP = [
  "default-src 'self'",
  // React/TanStack hydration + Vite dev; inline scripts injected by SSR runtime.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.dev https://*.lovable.app",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.dev https://*.lovable.app https://ai.gateway.lovable.dev",
  // Allow embedding inside the Lovable editor preview iframe.
  "frame-ancestors 'self' https://*.lovable.dev https://*.lovable.app",
  "frame-src 'self' https://accounts.google.com https://*.supabase.co",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://*.supabase.co",
  "object-src 'none'",
  "worker-src 'self' blob:",
].join("; ");

function isApiRequest(request: Request): boolean {
  const { pathname } = new URL(request.url);
  return pathname.startsWith("/api/") || pathname === "/api";
}

function applySecurityHeaders(response: Response, request?: Request): Response {
  const contentType = response.headers.get("content-type") ?? "";
  const headers = new Headers(response.headers);
  const isHtml = contentType.includes("text/html");
  const isApi = request ? isApiRequest(request) : false;

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  if (isApi && !isHtml) {
    // API/data endpoints are never meant to be rendered or framed: lock them down
    // harder than documents so SSR and endpoints stay consistent, not divergent.
    headers.set("Content-Security-Policy", API_CSP);
    headers.set("X-Frame-Options", "DENY");
    if (!headers.has("Cache-Control")) {
      headers.set("Cache-Control", "no-store");
    }
  } else {
    headers.set("X-Frame-Options", "SAMEORIGIN");
    if (isHtml) {
      headers.set("Content-Security-Policy", CSP);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return applySecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};

