import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;

  return (
    <SidebarProvider>
      <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur sm:px-4">
            <SidebarTrigger aria-label="Mostrar u ocultar el menú lateral" />
            <div className="ml-auto"><LanguageSwitcher /></div>
          </header>
          <main id="contenido-principal" tabIndex={-1} className="page-enter min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
