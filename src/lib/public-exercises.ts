export type PublicExercise = {
  slug: string;
  name: string;
  objective: string;
  category: "prebenjamin" | "benjamin" | "alevin" | "infantil" | "cadete";
  phase: "posesion" | "finalizacion" | "presion" | "transiciones" | "juegos-reducidos";
  players: string;
  duration: string;
  space: string;
  description: string;
  tags: string[];
};

export const CATEGORIES = [
  { id: "prebenjamin", label: "Prebenjamín (U6-U8)", desc: "Diversión, balón individual, motricidad" },
  { id: "benjamin", label: "Benjamín (U8-U10)", desc: "Técnica individual y juegos reducidos" },
  { id: "alevin", label: "Alevín (U10-U12)", desc: "Fútbol 7, conceptos tácticos básicos" },
  { id: "infantil", label: "Infantil (U12-U14)", desc: "Paso a fútbol 11, estructura por líneas" },
  { id: "cadete", label: "Cadete (U14-U16)", desc: "Modelo de juego y rendimiento" },
] as const;

export const PHASES = [
  { id: "posesion", label: "Posesión y construcción" },
  { id: "finalizacion", label: "Finalización" },
  { id: "presion", label: "Presión y defensa" },
  { id: "transiciones", label: "Transiciones" },
  { id: "juegos-reducidos", label: "Juegos reducidos (F7/F11)" },
] as const;

export const PUBLIC_EXERCISES: PublicExercise[] = [
  { slug: "rondo-4v2-apoyos", name: "Rondo 4v2 con apoyos exteriores", objective: "Mejorar la circulación rápida del balón y la toma de decisiones bajo presión.", category: "alevin", phase: "posesion", players: "8-10", duration: "15 min", space: "15×15 m", description: "Cuatro jugadores en el perímetro y dos defensores en el interior. Pase máximo de 2 toques. Si el defensor recupera, rota con quien perdió el balón. Variante: añadir un comodín neutral para forzar líneas de pase verticales.", tags: ["posesión", "pase", "presión"] },
  { slug: "posesion-6v6-2-zonas", name: "Posesión 6v6+2 en 3 zonas", objective: "Aprender a progresar a través de líneas en fútbol 11.", category: "infantil", phase: "posesion", players: "14", duration: "20 min", space: "40×30 m", description: "Campo dividido en tres zonas longitudinales. Para puntuar, el equipo debe completar 3 pases en una zona y trasladar el juego a la siguiente con un pase entre líneas. Los comodines juegan siempre con el equipo en posesión.", tags: ["fútbol 11", "construcción", "entre líneas"] },
  { slug: "conduccion-slalom-tiro", name: "Conducción slalom + tiro", objective: "Reforzar técnica individual de conducción y definición.", category: "benjamin", phase: "finalizacion", players: "6-12", duration: "12 min", space: "20×10 m", description: "El jugador conduce el balón entre 5 conos y termina con un tiro a portería pequeña. Alternar pie dominante y no dominante. Premia la velocidad de conducción sin perder el control.", tags: ["técnica", "conducción", "tiro"] },
  { slug: "finalizacion-2v1-banda", name: "Finalización 2v1 desde banda", objective: "Mejorar la creación de superioridades y el centro al área.", category: "alevin", phase: "finalizacion", players: "9-12", duration: "18 min", space: "Medio campo", description: "Extremo y delantero atacan contra un central. El extremo decide entre el desborde para centro raso o el pase al espacio para cruce al primer palo. Rotación cada 3 repeticiones.", tags: ["centros", "fútbol 7", "superioridad"] },
  { slug: "presion-tras-perdida-6s", name: "Presión tras pérdida 6 segundos", objective: "Entrenar la reacción defensiva inmediata tras perder el balón.", category: "cadete", phase: "presion", players: "12-14", duration: "20 min", space: "35×30 m", description: "Posesión 5v5+2. Cuando un equipo pierde el balón, dispone de 6 segundos para recuperar o evitar pase progresivo. Si lo consigue, gana 1 punto. Si no, el equipo rival inicia ataque libre.", tags: ["pressing", "transición defensiva", "intensidad"] },
  { slug: "defensa-zonal-linea-4", name: "Defensa zonal en línea de 4", objective: "Coordinar movimientos colectivos de la línea defensiva.", category: "infantil", phase: "presion", players: "8-11", duration: "20 min", space: "40×25 m", description: "Cuatro defensas frente a 3 atacantes con un mediocentro que distribuye. La línea practica basculaciones, coberturas y achiques en función del lado del balón. Sin portería en fase 1; con portería en fase 2.", tags: ["línea de 4", "fútbol 11", "estructura"] },
  { slug: "transicion-3v2-2v3", name: "Transición ofensiva 3v2 → 2v3", objective: "Optimizar la ejecución de contraataques y repliegues.", category: "cadete", phase: "transiciones", players: "10", duration: "20 min", space: "Campo completo F7", description: "Equipo A inicia con balón en 3v2 hacia portería. Tras tiro o recuperación, equipo B sale 2v3 al campo contrario en máximo 8 segundos. Premiar verticalidad y primer pase a la espalda.", tags: ["contraataque", "verticalidad", "decisión"] },
  { slug: "juego-reducido-4v4-2-f7", name: "Juego reducido 4v4+2 fútbol 7", objective: "Trabajar todas las fases del juego en formato competitivo.", category: "alevin", phase: "juegos-reducidos", players: "10", duration: "25 min", space: "30×25 m con 2 porterías", description: "Partido condicionado: gol vale doble si llega tras 5 pases consecutivos. Los comodines juegan siempre con el equipo en posesión. Cambios cada 4 minutos.", tags: ["fútbol 7", "competición", "global"] },
  { slug: "partido-posicional-7v7-f11", name: "Partido posicional 7v7 fútbol 11", objective: "Reforzar ocupación de espacios en estructura 1-3-3.", category: "infantil", phase: "juegos-reducidos", players: "14", duration: "30 min", space: "50×40 m", description: "Campo dividido en 6 zonas (3 horizontales × 2 verticales). Cada jugador debe respetar su pareja de zonas asignadas. Premia el cambio de orientación con pase aéreo controlado al carril opuesto.", tags: ["fútbol 11", "juego posicional", "ocupación"] },
  { slug: "circuito-motriz-balon", name: "Circuito motriz con balón", objective: "Desarrollar coordinación, equilibrio y familiaridad con el balón.", category: "prebenjamin", phase: "posesion", players: "6-12", duration: "10 min", space: "15×15 m", description: "Estaciones de 45 segundos: conducción entre aros, saltos con balón en mano, pase contra pared, y mini-portería. Rotan en grupos de 2-3. Énfasis en diversión y muchas repeticiones.", tags: ["motricidad", "iniciación", "técnica"] },
  { slug: "1v1-portero-espacio", name: "1v1 con portero al espacio", objective: "Mejorar el duelo individual ofensivo y defensivo.", category: "benjamin", phase: "finalizacion", players: "6-12", duration: "15 min", space: "20×15 m", description: "Atacante recibe pase del entrenador y encara al defensor en carrera. Limita a 6 segundos para finalizar. Rotación atacante → defensor → cola. Premia la regate al primer toque.", tags: ["duelo", "1v1", "fútbol 7"] },
  { slug: "salida-balon-3gk-vs-2", name: "Salida de balón 3+GK vs 2", objective: "Aprender a iniciar el juego desde portero con dos centrales y pivote.", category: "cadete", phase: "posesion", players: "6", duration: "20 min", space: "Medio campo", description: "Portero y dos centrales construyen contra presión de dos delanteros. El pivote ofrece línea de pase interior. Objetivo: superar la primera línea con pase al pivote o conducción del central.", tags: ["salida de balón", "fútbol 11", "portero"] },
];

export function findExercise(slug: string) {
  return PUBLIC_EXERCISES.find((e) => e.slug === slug);
}

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function phaseLabel(id: string) {
  return PHASES.find((p) => p.id === id)?.label ?? id;
}
