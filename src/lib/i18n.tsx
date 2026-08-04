import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "es-ES" | "en-GB";

const STORAGE_KEY = "planeofut-language";

const ENGLISH: Record<string, string> = {
  "Página no encontrada": "Page not found",
  "La página que buscas no existe o se ha movido.": "The page you are looking for does not exist or has moved.",
  "Volver al inicio": "Back to home",
  "Esta página no se ha podido cargar": "This page could not be loaded",
  "Algo salió mal. Puedes reintentar o volver al inicio.": "Something went wrong. Try again or return to the home page.",
  "Reintentar": "Try again",
  "Inicio": "Home",
  "Entrar": "Sign in",
  "Empezar gratis": "Start for free",
  "Crear cuenta": "Create account",
  "Crear cuenta gratuita": "Create free account",
  "Ya tengo cuenta": "I already have an account",
  "Planifica tu temporada como un profesional": "Plan your season like a professional",
  "Crea ejercicios, sesiones, microciclos y temporadas completas. Diseñado para fútbol base, cantera, amateur y alto rendimiento.": "Build practices, training sessions, microcycles and complete season plans. Designed for grassroots, academy, amateur and high-performance football.",
  "Biblioteca de ejercicios": "Practice library",
  "Sesiones con bloques": "Structured training sessions",
  "Microciclo semanal": "Weekly microcycle",
  "Periodización visual": "Visual periodisation",
  "Gestión de plantilla": "Squad management",
  "Reutiliza y versiona": "Reuse and version",
  "Dashboard": "Dashboard",
  "Ejercicios": "Practices",
  "Sesiones": "Training sessions",
  "Microciclos": "Microcycles",
  "Pretemporada": "Pre-season",
  "Temporada": "Season",
  "Calendario": "Calendar",
  "Equipo": "Squad",
  "Biblioteca pública": "Public practice library",
  "Planificación": "Planning",
  "Cerrar sesión": "Sign out",
  "Tu panel de control para diseñar entrenamientos profesionales.": "Your coaching hub for building professional training programmes.",
  "Sesiones recientes": "Recent training sessions",
  "Ver todas": "View all",
  "Aún no hay sesiones": "No training sessions yet",
  "Crea tu primera sesión combinando ejercicios en bloques.": "Build your first session by organising practices into training blocks.",
  "Nueva sesión": "New training session",
  "Accesos rápidos": "Quick actions",
  "Nuevo ejercicio": "New practice",
  "Ver calendario": "View calendar",
  "Configurar equipo": "Set up squad",
  "Equipos": "Squads",
  "Crea, filtra y reutiliza ejercicios con ficha completa.": "Create, filter and reuse detailed football practices.",
  "Buscar por nombre, objetivo o etiqueta…": "Search by name, coaching outcome or tag…",
  "Fase del juego": "Phase of play",
  "Todas las fases": "All phases",
  "Intensidad": "Intensity",
  "Cualquier intensidad": "Any intensity",
  "Favoritos": "Favourites",
  "Cargando…": "Loading…",
  "Aún no tienes ejercicios": "You have no practices yet",
  "No hay coincidencias con los filtros": "No practices match these filters",
  "Crea tu primer ejercicio para empezar tu biblioteca.": "Create your first practice to start building your library.",
  "Prueba a ajustar la búsqueda o quitar filtros.": "Try refining your search or clearing the filters.",
  "Crear ejercicio": "Create practice",
  "Favorito": "Favourite",
  "jug.": "players",
  "Agrupa ejercicios en bloques estructurados.": "Organise practices into structured training blocks.",
  "Plantilla": "Template",
  "Abrir": "Open",
  "Duplicar": "Duplicate",
  "Eliminar": "Delete",
  "Aún no tienes sesiones": "You have no training sessions yet",
  "Combina ejercicios en bloques: calentamiento, parte principal, juego y vuelta a la calma.": "Combine practices into warm-up, main phase, conditioned game and cool-down blocks.",
  "Crear sesión": "Create training session",
  "3 entrenamientos + partido (sábado o domingo).": "Three training days plus a Saturday or Sunday fixture.",
  "Nuevo microciclo": "New microcycle",
  "Aún no tienes microciclos": "You have no microcycles yet",
  "Planifica tu semana con 3 sesiones y partido. Cada slot tendrá su carga e intención.": "Plan three training days and a fixture. Give each slot its own load and coaching intent.",
  "Crear microciclo": "Create microcycle",
  "Calendario semanal": "Weekly schedule",
  "Semana anterior": "Previous week",
  "Semana siguiente": "Next week",
  "Hoy": "Today",
  "sin sesión": "no session assigned",
  "Libre": "Rest day",
  "Intensidad de sesiones": "Training intensity",
  "Baja": "Low",
  "Media": "Moderate",
  "Alta": "High",
  "Muy alta": "Very high",
  "baja": "low",
  "media": "moderate",
  "alta": "high",
  "muy_alta": "very high",
  "Fase de inicio": "Build-up phase",
  "Progresión": "Progression",
  "Finalización": "Finishing",
  "Transición Ataque-Defensa": "Attacking-to-defensive transition",
  "Transición Defensa-Ataque": "Defensive-to-attacking transition",
  "General": "General",
  "Calentamiento": "Warm-up",
  "Parte principal": "Main phase",
  "Juego de aplicación": "Conditioned game",
  "Vuelta a la calma": "Cool-down",
  "Partido oficial": "Competitive fixture",
  "Amistoso": "Friendly",
  "Test físico": "Physical testing",
  "Descanso": "Recovery day",
  "Evento": "Event",
  "Reunión": "Team meeting",
  "Sábado": "Saturday",
  "Domingo": "Sunday",
  "Evaluación post-sesión": "Post-session review",
  "Valora cómo fue el entrenamiento. Se guarda automáticamente.": "Review the session outcome. Changes are saved automatically.",
  "Guardando…": "Saving…",
  "Valoración global": "Overall session rating",
  "Intensidad percibida": "Perceived intensity",
  "¿Se cumplieron los objetivos?": "Were the coaching outcomes achieved?",
  "Qué funcionó bien": "What worked well",
  "Qué mejorar": "Areas to improve",
  "Notas sobre jugadores": "Player notes",
  "Eliminar evaluación": "Delete review",
  "Accede a tu cuenta": "Sign in to your account",
  "Diseña tu próxima sesión en minutos": "Build your next training session in minutes",
  "Planifica como un profesional.": "Plan like a professional.",
  "Ejercicios, sesiones, microciclos y temporadas completas en una sola herramienta diseñada para entrenadores serios.": "Practices, sessions, microcycles and complete season plans in one workspace for ambitious coaches.",
  "Continuar con Google": "Continue with Google",
  "o con email": "or use email",
  "Contraseña": "Password",
  "Nombre": "Name",
  "Ejercicios de fútbol base": "Grassroots football practices",
  "Ejercicios de Fútbol Base": "Grassroots Football Practices",
  "Buscar ejercicios": "Search practices",
  "Buscar por nombre, descripción o etiqueta…": "Search by name, description or tag…",
  "Filtrar por categoría": "Filter by age group",
  "Categoría": "Age group",
  "Todas las categorías": "All age groups",
  "Filtrar por fase táctica": "Filter by phase of play",
  "Fase táctica": "Phase of play",
  "Filtrar por objetivo": "Filter by coaching outcome",
  "Objetivo táctico (ej. presión, centros, salida de balón)…": "Coaching outcome (e.g. pressing, crossing, playing out)…",
  "No hay ejercicios con esos filtros.": "No practices match those filters.",
  "Limpiar filtros": "Clear filters",
  "Jugadores": "Players",
  "Duración": "Duration",
  "Fase": "Phase",
  "Ver ficha": "View practice",
  "Categorías": "Age groups",
  "Fases tácticas": "Phases of play",
  "Guarda tus favoritos y úsalos en tus sesiones": "Save favourites and add them to your sessions",
  "Volver a la biblioteca": "Back to the library",
  "Mi biblioteca": "My practice library",
  "Guardar en favoritos": "Save to favourites",
  "Guardado en favoritos": "Saved to favourites",
  "Importar a mi biblioteca": "Add to my practice library",
  "Descripción de la tarea": "Practice organisation",
  "Etiquetas": "Tags",
  "Más ejercicios": "More practices",
  "Ver ejercicios →": "View practices →",
  "Espacio": "Area",
  "Objetivos": "Objectives",
  "Notas": "Notes",
  "Fases": "Phases",
  "Nombre *": "Name *",
  "Día de partido": "Match day",
  "Edad": "Age group",
  "Escudo del equipo": "Club badge",
  "Subir escudo": "Upload badge",
  "Añadir jugador": "Add player",
  "Número": "Squad number",
  "Posición": "Position",
  "Sin jugadores aún.": "No players added yet.",
};

const SPANISH = Object.fromEntries(Object.entries(ENGLISH).map(([es, en]) => [en, es]));
const MONTHS: Record<string, string> = {
  enero: "January", febrero: "February", marzo: "March", abril: "April", mayo: "May", junio: "June",
  julio: "July", agosto: "August", septiembre: "September", octubre: "October", noviembre: "November", diciembre: "December",
  lunes: "Monday", martes: "Tuesday", miércoles: "Wednesday", jueves: "Thursday", viernes: "Friday", sábado: "Saturday", domingo: "Sunday",
};

export function translateCopy(value: string, language: AppLanguage): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const text = value.trim();
  if (!text) return value;
  const direct = language === "en-GB" ? ENGLISH[text] : SPANISH[text];
  if (direct) return `${leading}${direct}${trailing}`;
  if (language === "en-GB") {
    let translated = text
      .replace(/^Hola, (.+) 👋$/, "Welcome, $1")
      .replace(/^Semana del (.+) al (.+)$/, "Week from $1 to $2")
      .replace(/^Semana del (.+)$/, "Week commencing $1")
      .replace(/^(\d+) de (\d+) ejercicios$/, "$1 of $2 practices")
      .replace(/^(\d+) sesiones$/, "$1 training sessions")
      .replace(/^(\d+) sesión$/, "$1 training session");
    for (const [es, en] of Object.entries(MONTHS)) translated = translated.replace(new RegExp(`\\b${es}\\b`, "gi"), en);
    return `${leading}${translated}${trailing}`;
  }
  return value;
}

type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "es-ES", setLanguage: () => undefined });

function localiseDom(root: ParentNode, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const next = translateCopy(node.data, language);
    if (next !== node.data) node.data = next;
  });
  if (root instanceof Element) {
    [root, ...Array.from(root.querySelectorAll("[placeholder], [aria-label], [title]"))].forEach((element) => {
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, translateCopy(value, language));
      });
    });
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("es-ES");
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en-GB" || saved === "es-ES") setLanguageState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
    localiseDom(document.body, language);
    const observer = new MutationObserver((records) => records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode) localiseDom(node.parentNode, language);
        else if (node instanceof Element) localiseDom(node, language);
      });
    }));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage: setLanguageState }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function getAppLocale(): AppLanguage {
  if (typeof window === "undefined") return "es-ES";
  return window.localStorage.getItem(STORAGE_KEY) === "en-GB" ? "en-GB" : "es-ES";
}