import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { ArrowLeft, Check, Dumbbell, Loader2, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, PHASES, categoryLabel, findExercise, phaseLabel } from "@/lib/public-exercises";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const SITE_URL = "https://planeo-fut.lovable.app";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "all").default("all"),
  phase: fallback(z.string(), "all").default("all"),
  obj: fallback(z.string(), "").default(""),
});

function mapPhase(p: string): string {
  switch (p) {
    case "posesion": return "progresion";
    case "finalizacion": return "finalizacion";
    case "presion": return "transicion_ad";
    case "transiciones": return "transicion_da";
    case "juegos-reducidos": return "general";
    default: return "general";
  }
}

function mapTaskType(p: string): string {
  switch (p) {
    case "juegos-reducidos": return "juego_reducido";
    case "posesion": return "rondo";
    case "finalizacion": return "analitica";
    case "presion": return "situacional";
    default: return "global";
  }
}

function parseDuration(d: string): number | null {
  const m = d.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parsePlayers(p: string): number | null {
  const m = p.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export const Route = createFileRoute("/ejercicios/futbol-base/$slug")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ params }) => {
    const exercise = findExercise(params.slug);
    if (!exercise) throw notFound();
    return { exercise };
  },
  head: ({ loaderData }) => {
    const ex = loaderData?.exercise;
    if (!ex) return {};
    const title = `${ex.name} — Ejercicio de fútbol base (${categoryLabel(ex.category)}) | PlaneoFUT`;
    const desc = `${ex.objective} Categoría ${categoryLabel(ex.category)}, fase ${phaseLabel(ex.phase)}. Duración ${ex.duration}, espacio ${ex.space}, jugadores ${ex.players}.`;
    const url = `${SITE_URL}/ejercicios/futbol-base/${ex.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: ex.name,
            description: ex.description,
            totalTime: `PT${parseDuration(ex.duration) ?? 15}M`,
            step: [{ "@type": "HowToStep", text: ex.description }],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Ejercicios de fútbol base", item: `${SITE_URL}/ejercicios/futbol-base` },
              { "@type": "ListItem", position: 3, name: ex.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-bold">Ejercicio no encontrado</h1>
      <Button asChild className="mt-6"><Link to="/ejercicios/futbol-base">Volver a la biblioteca</Link></Button>
    </div>
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">No se pudo cargar el ejercicio</h1>
        <Button className="mt-6" onClick={() => { router.invalidate(); reset(); }}>Reintentar</Button>
      </div>
    );
  },
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { exercise: ex } = Route.useLoaderData();
  const search = Route.useSearch();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  async function importToLibrary(asFavorite: boolean) {
    if (!user) {
      toast.error("Inicia sesión para guardar el ejercicio");
      return;
    }
    setImporting(true);
    try {
      const sourceTag = `origen:${ex.slug}`;
      const { data: existing } = await (supabase.from("exercises") as any)
        .select("id")
        .eq("owner_id", user.id)
        .contains("tags", [sourceTag])
        .maybeSingle();

      if (existing?.id) {
        if (asFavorite) {
          const { error } = await (supabase.from("exercises") as any)
            .update({ is_favorite: true }).eq("id", existing.id);
          if (error) throw error;
        }
        setImported(true);
        toast.success("Ya estaba en tu biblioteca — marcado como favorito");
        return;
      }

      const row = {
        owner_id: user.id,
        name: ex.name,
        objective: ex.objective,
        observations: ex.description,
        space: ex.space,
        duration_min: parseDuration(ex.duration),
        players_count: parsePlayers(ex.players),
        game_phase: mapPhase(ex.phase),
        task_type: mapTaskType(ex.phase),
        intensity: "media",
        age_group: categoryLabel(ex.category),
        tags: [...ex.tags, sourceTag],
        is_favorite: asFavorite,
      };
      const { error } = await (supabase.from("exercises") as any).insert(row);
      if (error) throw error;
      setImported(true);
      toast.success(asFavorite ? "Guardado en favoritos" : "Importado a tu biblioteca");
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-gradient shadow-glow">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">PlaneoFUT</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="ghost" size="sm"><Link to="/exercises">Mi biblioteca</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
                <Button asChild size="sm"><Link to="/auth">Empezar gratis</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pt-8">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/ejercicios/futbol-base" search={search}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver a la biblioteca
          </Link>
        </Button>
        <nav aria-label="breadcrumb" className="mt-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span className="mx-2">/</span>
          <Link to="/ejercicios/futbol-base" search={search} className="hover:text-primary">Ejercicios de fútbol base</Link>
          <span className="mx-2">/</span>
          <span>{ex.name}</span>
        </nav>
      </div>

      <article className="mx-auto max-w-4xl px-6 pt-6 pb-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{categoryLabel(ex.category)}</Badge>
          <Badge>{phaseLabel(ex.phase)}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{ex.name}</h1>
        <p className="mt-3 text-lg font-medium text-primary">{ex.objective}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => importToLibrary(true)} disabled={importing || imported}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : imported ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
            {imported ? "Guardado en favoritos" : "Guardar en favoritos"}
          </Button>
          <Button variant="outline" onClick={() => importToLibrary(false)} disabled={importing || imported}>
            <Dumbbell className="mr-2 h-4 w-4" /> Importar a mi biblioteca
          </Button>
          {!user && (
            <p className="w-full text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">Inicia sesión</Link> para guardar este ejercicio y reutilizarlo en sesiones y microciclos.
            </p>
          )}
        </div>

        <Card className="mt-8 grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Jugadores</dt><dd className="text-base font-semibold">{ex.players}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Duración</dt><dd className="text-base font-semibold">{ex.duration}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Espacio</dt><dd className="text-base font-semibold">{ex.space}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Categoría</dt><dd className="text-base font-semibold">{categoryLabel(ex.category)}</dd></div>
        </Card>

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">Descripción de la tarea</h2>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/90">{ex.description}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">Etiquetas</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ex.tags.map((t: string) => <Badge key={t} variant="secondary">#{t}</Badge>)}
          </div>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.filter((c) => c.id !== ex.category).slice(0, 2).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="text-xs text-muted-foreground">Más ejercicios</div>
              <h3 className="mt-1 font-semibold">{c.label}</h3>
              <Button asChild variant="link" size="sm" className="-ml-3 mt-1">
                <Link to="/ejercicios/futbol-base" search={{ ...search, cat: c.id }}>Ver ejercicios →</Link>
              </Button>
            </Card>
          ))}
          {PHASES.filter((p) => p.id !== ex.phase).slice(0, 2).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="text-xs text-muted-foreground">Fase táctica</div>
              <h3 className="mt-1 font-semibold">{p.label}</h3>
              <Button asChild variant="link" size="sm" className="-ml-3 mt-1">
                <Link to="/ejercicios/futbol-base" search={{ ...search, phase: p.id }}>Ver ejercicios →</Link>
              </Button>
            </Card>
          ))}
        </section>
      </article>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PlaneoFUT · <Link to="/ejercicios/futbol-base" search={search} className="hover:text-primary">Biblioteca pública</Link>
      </footer>
    </div>
  );
}
