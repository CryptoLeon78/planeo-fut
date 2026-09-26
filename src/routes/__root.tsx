import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Send, Mail } from "lucide-react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { initQueryPersistence } from "@/lib/query-persister";
import { registerServiceWorker } from "@/lib/service-worker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o se ha movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[PlaneoFUT ErrorComponent]", error);
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const errorMessage = error?.message || String(error);
  const isSupabaseError = errorMessage.toLowerCase().includes("supabase") || errorMessage.toLowerCase().includes("not configured") || errorMessage.toLowerCase().includes("fetch");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border/80 bg-card p-6 text-center shadow-xl">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no se ha podido cargar
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSupabaseError
            ? "No se ha podido conectar con el servidor remoto. Puedes continuar usando la app en Modo Local resiliente."
            : "Algo salió mal al cargar esta sección. Puedes reintentar o volver al inicio."}
        </p>

        {isSupabaseError && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-left text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">💡 Versión Portable de Windows:</p>
            <p>
              Si estás ejecutando <code className="rounded bg-muted px-1 font-mono text-foreground">PlaneoFUT-Portable</code>, edita el archivo <code className="rounded bg-muted px-1 font-mono text-foreground">portable-config.json</code> en esa misma carpeta para añadir las credenciales de tu proyecto.
            </p>
          </div>
        )}

        <div className="text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary underline focus:outline-none"
          >
            {showDetails ? "Ocultar detalles técnicos" : "Ver detalles técnicos del error"}
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-36 overflow-auto rounded bg-muted p-2.5 font-mono text-[11px] text-destructive whitespace-pre-wrap">
              {errorMessage}
            </pre>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Modo Local / Dashboard
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

function SocialHeader() {
  return (
    <div className="w-full bg-muted/30 border-b border-border/40 py-1.5">
      <div className="mx-auto max-w-6xl px-6 flex justify-end items-center gap-4">
        <a
          href="https://x.com/ivanaza78"
          target="_blank"
          rel="noreferrer"
          aria-label="X de PlaneoFUT: @ivanaza78"
          className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26L22.83 21.75h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
        </a>
        <a
          href="https://t.me/futbolbaseparatodos"
          target="_blank"
          rel="noreferrer"
          aria-label="Telegram de PlaneoFUT: @futbolbaseparatodos"
          className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <span
          title="Discord: ivan.aza.78"
          aria-label="Discord de PlaneoFUT: ivan.aza.78"
          className="text-muted-foreground"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
          </svg>
        </span>
        <a href="mailto:ivanaza8@gmail.com" aria-label="Contacto por correo electrónico con PlaneoFUT" className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Saltar al contenido principal
        </a>
        <SocialHeader />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0f172a" },
      { name: "author", content: "PlaneoFUT" },
      { property: "og:site_name", content: "PlaneoFUT" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const cleanup = initQueryPersistence(queryClient);
    const cleanupServiceWorker = registerServiceWorker();
    return () => {
      cleanup();
      cleanupServiceWorker?.();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
