import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Calendar, ClipboardList, Dumbbell, LineChart, Loader2, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "https://planeofut.com";
const TITLE = "PlaneoFUT — Planificación profesional de entrenamientos de fútbol";
const DESC = "Crea ejercicios, sesiones, microciclos y temporadas completas. La herramienta del entrenador moderno para fútbol base, cantera, amateur y alto rendimiento.";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PlaneoFUT",
          url: SITE_URL,
          description: DESC,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PlaneoFUT",
          url: SITE_URL,
          email: "info@planeofut.com",
          description: "Herramienta de planificación de entrenamientos de fútbol para entrenadores.",
        }),
      },
    ],
  }),
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // Only redirect once we know the auth state (loading === false)
  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard" });
    }
  }, [session, loading, navigate]);

  // Avoid blank flash: show spinner while Supabase resolves the session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-gradient shadow-glow">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">PlaneoFUT</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/auth">Empezar gratis</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
          Planifica tu <span className="bg-primary-gradient bg-clip-text text-transparent">temporada</span> como un profesional
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Crea ejercicios, sesiones, microciclos y temporadas completas. Diseñado para fútbol base,
          cantera, amateur y alto rendimiento.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/auth">Crear cuenta</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Dumbbell, title: "Biblioteca de ejercicios", desc: "Ficha completa: objetivo, fase, intensidad, espacio, material y etiquetas." },
          { icon: ClipboardList, title: "Sesiones con bloques", desc: "Calentamiento, parte principal, juego de aplicación y vuelta a la calma." },
          { icon: Calendar, title: "Microciclo semanal", desc: "3 sesiones + partido sábado/domingo sin romper la planificación." },
          { icon: LineChart, title: "Periodización visual", desc: "Pretemporada y temporada por mesociclos con carga e intensidad por día." },
          { icon: Users, title: "Gestión de plantilla", desc: "Equipo, categoría, calendario de partidos y staff." },
          { icon: Trophy, title: "Reutiliza y versiona", desc: "Duplica sesiones, guarda favoritos, plantillas reutilizables." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border/60 bg-card p-5 shadow-card transition hover:border-primary/40">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
