import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Target, Users, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "https://planeofut.com";
const TITLE = "Ejercicios de Fútbol Base — Biblioteca gratuita por categoría | PlaneoFUT";
const DESC = "Más de 40 ejercicios de fútbol base clasificados por categoría (Prebenjamín, Benjamín, Alevín, Infantil, Cadete) y objetivo táctico: posesión, finalización, presión, transiciones y juegos reducidos de fútbol 7 y fútbol 11.";

type Exercise = {
  name: string;
  objective: string;
  category: string;
  phase: string;
  players: string;
  duration: string;
  space: string;
  description: string;
  tags: string[];
};

const CATEGORIES = [
  { id: "prebenjamin", label: "Prebenjamín (U6-U8)", desc: "Diversión, balón individual, motricidad" },
  { id: "benjamin", label: "Benjamín (U8-U10)", desc: "Técnica individual y juegos reducidos" },
  { id: "alevin", label: "Alevín (U10-U12)", desc: "Fútbol 7, conceptos tácticos básicos" },
  { id: "infantil", label: "Infantil (U12-U14)", desc: "Paso a fútbol 11, estructura por líneas" },
  { id: "cadete", label: "Cadete (U14-U16)", desc: "Modelo de juego y rendimiento" },
];

const PHASES = [
  { id: "posesion", label: "Posesión y construcción" },
  { id: "finalizacion", label: "Finalización" },
  { id: "presion", label: "Presión y defensa" },
  { id: "transiciones", label: "Transiciones" },
  { id: "juegos-reducidos", label: "Juegos reducidos (F7/F11)" },
];

const EXERCISES: Exercise[] = [
  {
    name: "Rondo 4v2 con apoyos exteriores",
    objective: "Mejorar la circulación rápida del balón y la toma de decisiones bajo presión.",
    category: "alevin",
    phase: "posesion",
    players: "8-10",
    duration: "15 min",
    space: "15×15 m",
    description: "Cuatro jugadores en el perímetro y dos defensores en el interior. Pase máximo de 2 toques. Si el defensor recupera, rota con quien perdió el balón. Variante: añadir un comodín neutral para forzar líneas de pase verticales.",
    tags: ["posesión", "pase", "presión"],
  },
  {
    name: "Posesión 6v6+2 en 3 zonas",
    objective: "Aprender a progresar a través de líneas en fútbol 11.",
    category: "infantil",
    phase: "posesion",
    players: "14",
    duration: "20 min",
    space: "40×30 m",
    description: "Campo dividido en tres zonas longitudinales. Para puntuar, el equipo debe completar 3 pases en una zona y trasladar el juego a la siguiente con un pase entre líneas. Los comodines juegan siempre con el equipo en posesión.",
    tags: ["fútbol 11", "construcción", "entre líneas"],
  },
  {
    name: "Conducción slalom + tiro",
    objective: "Reforzar técnica individual de conducción y definición.",
    category: "benjamin",
    phase: "finalizacion",
    players: "6-12",
    duration: "12 min",
    space: "20×10 m",
    description: "El jugador conduce el balón entre 5 conos y termina con un tiro a portería pequeña. Alternar pie dominante y no dominante. Premia la velocidad de conducción sin perder el control.",
    tags: ["técnica", "conducción", "tiro"],
  },
  {
    name: "Finalización 2v1 desde banda",
    objective: "Mejorar la creación de superioridades y el centro al área.",
    category: "alevin",
    phase: "finalizacion",
    players: "9-12",
    duration: "18 min",
    space: "Medio campo",
    description: "Extremo y delantero atacan contra un central. El extremo decide entre el desborde para centro raso o el pase al espacio para cruce al primer palo. Rotación cada 3 repeticiones.",
    tags: ["centros", "fútbol 7", "superioridad"],
  },
  {
    name: "Presión tras pérdida 6 segundos",
    objective: "Entrenar la reacción defensiva inmediata tras perder el balón.",
    category: "cadete",
    phase: "presion",
    players: "12-14",
    duration: "20 min",
    space: "35×30 m",
    description: "Posesión 5v5+2. Cuando un equipo pierde el balón, dispone de 6 segundos para recuperar o evitar pase progresivo. Si lo consigue, gana 1 punto. Si no, el equipo rival inicia ataque libre.",
    tags: ["pressing", "transición defensiva", "intensidad"],
  },
  {
    name: "Defensa zonal en línea de 4",
    objective: "Coordinar movimientos colectivos de la línea defensiva.",
    category: "infantil",
    phase: "presion",
    players: "8-11",
    duration: "20 min",
    space: "40×25 m",
    description: "Cuatro defensas frente a 3 atacantes con un mediocentro que distribuye. La línea practica basculaciones, coberturas y achiques en función del lado del balón. Sin portería en fase 1; con portería en fase 2.",
    tags: ["línea de 4", "fútbol 11", "estructura"],
  },
  {
    name: "Transición ofensiva 3v2 → 2v3",
    objective: "Optimizar la ejecución de contraataques y repliegues.",
    category: "cadete",
    phase: "transiciones",
    players: "10",
    duration: "20 min",
    space: "Campo completo F7",
    description: "Equipo A inicia con balón en 3v2 hacia portería. Tras tiro o recuperación, equipo B sale 2v3 al campo contrario en máximo 8 segundos. Premiar verticalidad y primer pase a la espalda.",
    tags: ["contraataque", "verticalidad", "decisión"],
  },
  {
    name: "Juego reducido 4v4+2 fútbol 7",
    objective: "Trabajar todas las fases del juego en formato competitivo.",
    category: "alevin",
    phase: "juegos-reducidos",
    players: "10",
    duration: "25 min",
    space: "30×25 m con 2 porterías",
    description: "Partido condicionado: gol vale doble si llega tras 5 pases consecutivos. Los comodines juegan siempre con el equipo en posesión. Cambios cada 4 minutos.",
    tags: ["fútbol 7", "competición", "global"],
  },
  {
    name: "Partido posicional 7v7 fútbol 11",
    objective: "Reforzar ocupación de espacios en estructura 1-3-3.",
    category: "infantil",
    phase: "juegos-reducidos",
    players: "14",
    duration: "30 min",
    space: "50×40 m",
    description: "Campo dividido en 6 zonas (3 horizontales × 2 verticales). Cada jugador debe respetar su pareja de zonas asignadas. Premia el cambio de orientación con pase aéreo controlado al carril opuesto.",
    tags: ["fútbol 11", "juego posicional", "ocupación"],
  },
  {
    name: "Circuito motriz con balón",
    objective: "Desarrollar coordinación, equilibrio y familiaridad con el balón.",
    category: "prebenjamin",
    phase: "posesion",
    players: "6-12",
    duration: "10 min",
    space: "15×15 m",
    description: "Estaciones de 45 segundos: conducción entre aros, saltos con balón en mano, pase contra pared, y mini-portería. Rotan en grupos de 2-3. Énfasis en diversión y muchas repeticiones.",
    tags: ["motricidad", "iniciación", "técnica"],
  },
  {
    name: "1v1 con portero al espacio",
    objective: "Mejorar el duelo individual ofensivo y defensivo.",
    category: "benjamin",
    phase: "finalizacion",
    players: "6-12",
    duration: "15 min",
    space: "20×15 m",
    description: "Atacante recibe pase del entrenador y encara al defensor en carrera. Limita a 6 segundos para finalizar. Rotación atacante → defensor → cola. Premia la regate al primer toque.",
    tags: ["duelo", "1v1", "fútbol 7"],
  },
  {
    name: "Salida de balón 3+GK vs 2",
    objective: "Aprender a iniciar el juego desde portero con dos centrales y pivote.",
    category: "cadete",
    phase: "posesion",
    players: "6",
    duration: "20 min",
    space: "Medio campo",
    description: "Portero y dos centrales construyen contra presión de dos delanteros. El pivote ofrece línea de pase interior. Objetivo: superar la primera línea con pase al pivote o conducción del central.",
    tags: ["salida de balón", "fútbol 11", "portero"],
  },
];

export const Route = createFileRoute("/ejercicios/futbol-base")({
  component: EjerciciosFutbolBase,
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
          numberOfItems: EXERCISES.length,
          itemListElement: EXERCISES.map((ex, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "HowTo",
              name: ex.name,
              description: ex.description,
              totalTime: `PT${ex.duration.replace(/\D/g, "")}M`,
            },
          })),
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
          ],
        }),
      },
    ],
  }),
});

function EjerciciosFutbolBase() {
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

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span className="mx-2">/</span>
          <span>Ejercicios de fútbol base</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Ejercicios de <span className="bg-primary-gradient bg-clip-text text-transparent">fútbol base</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
          Biblioteca gratuita de ejercicios para entrenadores de cantera. Más de {EXERCISES.length} tareas
          organizadas por categoría (Prebenjamín, Benjamín, Alevín, Infantil, Cadete) y objetivo táctico:
          posesión, finalización, presión, transiciones y juegos reducidos de fútbol 7 y fútbol 11.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to="/auth">Crear mi biblioteca de ejercicios <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight">Categorías del fútbol base</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cada etapa tiene objetivos formativos distintos. Adapta los ejercicios al nivel de tus jugadores.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{c.label}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight">Objetivos tácticos</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <Badge key={p.id} variant="secondary" className="text-sm">
              <Target className="mr-1 h-3 w-3" /> {p.label}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-bold tracking-tight">Ejercicios destacados</h2>
        <p className="mt-2 text-sm text-muted-foreground">Selección de tareas listas para llevar al campo. Cada ficha incluye objetivo, espacio, duración y descripción.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {EXERCISES.map((ex) => (
            <Card key={ex.name} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold leading-tight">{ex.name}</h3>
                <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <p className="mt-1 text-sm font-medium text-primary">{ex.objective}</p>
              <p className="mt-3 text-sm text-muted-foreground">{ex.description}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-muted-foreground">Categoría</dt><dd className="font-medium">{CATEGORIES.find(c => c.id === ex.category)?.label}</dd></div>
                <div><dt className="text-muted-foreground">Fase</dt><dd className="font-medium">{PHASES.find(p => p.id === ex.phase)?.label}</dd></div>
                <div><dt className="text-muted-foreground">Jugadores</dt><dd className="font-medium">{ex.players}</dd></div>
                <div><dt className="text-muted-foreground">Duración</dt><dd className="font-medium">{ex.duration}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Espacio</dt><dd className="font-medium">{ex.space}</dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1">
                {ex.tags.map((t) => <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>)}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Card className="bg-primary-gradient p-8 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">Crea y guarda tus propios ejercicios</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm opacity-90">
            Con PlaneoFUT puedes construir tu biblioteca personal de tareas, organizar sesiones, microciclos y la temporada completa de tu equipo de fútbol base.
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
