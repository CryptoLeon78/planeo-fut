import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, Dumbbell, Search, Target, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PHASES, PUBLIC_EXERCISES, categoryLabel, phaseLabel } from "@/lib/public-exercises";

const SITE_URL = "https://planeo-fut.lovable.app";
const TITLE = "Ejercicios de Fútbol Base — Biblioteca gratuita por categoría | PlaneoFUT";
const DESC = "Más de 40 ejercicios de fútbol base clasificados por categoría (Prebenjamín, Benjamín, Alevín, Infantil, Cadete) y objetivo táctico: posesión, finalización, presión, transiciones y juegos reducidos de fútbol 7 y fútbol 11.";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "all").default("all"),
  phase: fallback(z.string(), "all").default("all"),
  obj: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/ejercicios/futbol-base")({
  component: EjerciciosFutbolBase,
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "keywords", content: "ejercicios fútbol base, futbol 11 juegos, base de futbol, ejercicios fútbol 7, alevín, infantil, cadete, entrenamientos fútbol cantera" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE_URL}/ejercicios/futbol-base` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ejercicios/futbol-base` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Ejercicios de Fútbol Base",
          description: DESC,
          numberOfItems: PUBLIC_EXERCISES.length,
          itemListElement: PUBLIC_EXERCISES.map((ex, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/ejercicios/futbol-base/${ex.slug}`,
            name: ex.name,
          })),
        }),
      },
    ],
  }),
});

function EjerciciosFutbolBase() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filtered = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    return PUBLIC_EXERCISES.filter((ex) => {
      if (search.cat !== "all" && ex.category !== search.cat) return false;
      if (search.phase !== "all" && ex.phase !== search.phase) return false;
      if (search.obj && !ex.objective.toLowerCase().includes(search.obj.toLowerCase())) return false;
      if (q) {
        const hay = `${ex.name} ${ex.objective} ${ex.description} ${ex.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search]);

  function update(patch: Partial<typeof search>) {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-gradient shadow-glow">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">PlaneoFUT</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/auth">Empezar gratis</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Ejercicios de fútbol base</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Ejercicios de <span className="bg-primary-gradient bg-clip-text text-transparent">fútbol base</span>
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
          Biblioteca pública gratuita: {PUBLIC_EXERCISES.length} tareas listas para el campo. Busca por nombre,
          filtra por categoría, fase u objetivo táctico, y guárdalas en tu cuenta para usarlas en sesiones y microciclos.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-2">
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Buscar ejercicios"
                value={search.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Buscar por nombre, descripción o etiqueta…"
                className="pl-9"
              />
            </div>
            <Select value={search.cat} onValueChange={(v) => update({ cat: v })}>
              <SelectTrigger aria-label="Filtrar por categoría"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={search.phase} onValueChange={(v) => update({ phase: v })}>
              <SelectTrigger aria-label="Filtrar por fase táctica"><SelectValue placeholder="Fase táctica" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fases</SelectItem>
                {PHASES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Input
              aria-label="Filtrar por objetivo"
              value={search.obj}
              onChange={(e) => update({ obj: e.target.value })}
              placeholder="Objetivo táctico (ej. presión, centros, salida de balón)…"
              className="max-w-sm"
            />
            <div className="text-xs text-muted-foreground">{filtered.length} de {PUBLIC_EXERCISES.length} ejercicios</div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No hay ejercicios con esos filtros. <button className="text-primary underline" onClick={() => update({ q: "", cat: "all", phase: "all", obj: "" })}>Limpiar filtros</button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((ex) => (
              <Card key={ex.slug} className="flex flex-col p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold leading-tight">
                    <Link
                      to="/ejercicios/futbol-base/$slug"
                      params={{ slug: ex.slug }}
                      search={search}
                      className="hover:text-primary"
                    >
                      {ex.name}
                    </Link>
                  </h2>
                  <Dumbbell aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                </div>
                <p className="mt-1 text-sm font-medium text-primary">{ex.objective}</p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ex.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Categoría</dt><dd className="font-medium">{categoryLabel(ex.category)}</dd></div>
                  <div><dt className="text-muted-foreground">Fase</dt><dd className="font-medium">{phaseLabel(ex.phase)}</dd></div>
                  <div><dt className="text-muted-foreground">Jugadores</dt><dd className="font-medium">{ex.players}</dd></div>
                  <div><dt className="text-muted-foreground">Duración</dt><dd className="font-medium">{ex.duration}</dd></div>
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {ex.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>)}
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/ejercicios/futbol-base/$slug" params={{ slug: ex.slug }} search={search}>
                      Ver ficha <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-6">
        <h2 className="text-2xl font-bold tracking-tight">Categorías</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => update({ cat: c.id })} className="text-left">
              <Card className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2">
                  <Users aria-hidden className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{c.label}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-2xl font-bold tracking-tight">Fases tácticas</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <button key={p.id} onClick={() => update({ phase: p.id })}>
              <Badge variant={search.phase === p.id ? "default" : "secondary"} className="cursor-pointer text-sm">
                <Target aria-hidden className="mr-1 h-3 w-3" /> {p.label}
              </Badge>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <Card className="bg-primary-gradient p-8 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">Guarda tus favoritos y úsalos en tus sesiones</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm opacity-90">
            Crea una cuenta gratuita para guardar ejercicios en tu biblioteca personal, incluirlos en microciclos
            y planificar la temporada de tu equipo de fútbol base.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-6">
            <Link to="/auth">Empezar gratis</Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PlaneoFUT · <Link to="/" className="hover:text-primary">Inicio</Link>
      </footer>
    </div>
  );
}
