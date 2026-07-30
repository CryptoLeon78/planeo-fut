import { afterEach, describe, expect, it } from "vitest";
import {
  API_CSP,
  BASE_SECURITY_HEADERS,
  DOCUMENT_CSP,
  applySecurityHeaders,
  buildDocumentCsp,
  detectEnvironment,
  isDataEndpoint,
} from "@/lib/security-headers";


const html = () =>
  new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
const json = () =>
  new Response("{}", { headers: { "content-type": "application/json" } });

const req = (path: string) => new Request(`https://app.test${path}`);

describe("security headers", () => {
  it("aplica las cabeceras base en SSR, REST y RPC", () => {
    const responses = [
      applySecurityHeaders(html(), req("/")),
      applySecurityHeaders(json(), req("/api/health")),
      applySecurityHeaders(json(), req("/_serverFn/abc")),
    ];
    for (const res of responses) {
      for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
        expect(res.headers.get(name)).toBe(value);
      }
    }
  });

  it("usa la CSP de documento en respuestas HTML del SSR", () => {
    const res = applySecurityHeaders(html(), req("/dashboard"));
    expect(res.headers.get("Content-Security-Policy")).toBe(DOCUMENT_CSP);
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("usa la CSP bloqueada en REST y RPC", () => {
    for (const path of ["/api/health", "/_serverFn/abc"]) {
      const res = applySecurityHeaders(json(), req(path));
      expect(res.headers.get("Content-Security-Policy")).toBe(API_CSP);
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("no pisa un Cache-Control existente", () => {
    const res = applySecurityHeaders(
      new Response("{}", {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
      }),
      req("/api/public/stats"),
    );
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("la CSP de documento permite los recursos que la app necesita", () => {
    expect(DOCUMENT_CSP).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(DOCUMENT_CSP).toContain("https://fonts.googleapis.com");
    expect(DOCUMENT_CSP).toContain("https://fonts.gstatic.com");
    expect(DOCUMENT_CSP).toContain("https://*.supabase.co");
    expect(DOCUMENT_CSP).toContain("wss://*.supabase.co");
    expect(DOCUMENT_CSP).toContain("https://ai.gateway.lovable.dev");
    expect(DOCUMENT_CSP).toContain("frame-ancestors 'self' https://*.lovable.dev");
    expect(DOCUMENT_CSP).toContain("img-src 'self' data: blob: https:");
  });

  it("la CSP de datos no lleva sandbox y bloquea todo lo demás", () => {
    expect(API_CSP).toContain("default-src 'none'");
    expect(API_CSP).not.toContain("sandbox");
  });

  it("detecta correctamente los endpoints de datos", () => {
    expect(isDataEndpoint("https://app.test/api")).toBe(true);
    expect(isDataEndpoint("https://app.test/api/public/webhook")).toBe(true);
    expect(isDataEndpoint("https://app.test/_serverFn/x")).toBe(true);
    expect(isDataEndpoint("https://app.test/")).toBe(false);
    expect(isDataEndpoint("https://app.test/apionline")).toBe(false);
  });

  it("preserva status y cuerpo de la respuesta original", async () => {
    const res = applySecurityHeaders(
      new Response("nope", { status: 404, headers: { "content-type": "application/json" } }),
      req("/api/missing"),
    );
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("nope");
  });
});
