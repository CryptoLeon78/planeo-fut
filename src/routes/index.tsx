import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Calendar, ClipboardList, Dumbbell, LineChart, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-gradient shadow-glow">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">FutbolCoach</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/auth">Empezar gratis</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Para entrenadores de fútbol
        </span>
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
