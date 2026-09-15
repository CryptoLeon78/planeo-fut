/**
 * PlaneoFUT - User Workflow Simulation Script
 * Simula el flujo de trabajo real de un entrenador ("Carlos Méndez - Entrenador Alevín A")
 * creando un ejemplo completo de cada uno de los elementos clave de la plataforma.
 */

export interface DemoUserWorkflow {
  coach: {
    name: string;
    role: string;
    email: string;
    teamName: string;
  };
  team: {
    id: string;
    name: string;
    category: string;
    season: string;
    playersCount: number;
  };
  roster: Array<{
    id: string;
    name: string;
    number: number;
    position: string;
    status: "disponible" | "lesionado" | "duda";
  }>;
  injury: {
    id: string;
    playerName: string;
    injuryType: string;
    startDate: string;
    estimatedReturn: string;
    notes: string;
  };
  exercise: {
    id: string;
    name: string;
    category: string;
    gamePhase: string;
    intensity: string;
    objectiveAttack: string;
    objectiveDefense: string;
    provocationRule: string;
    continuityRule: string;
  };
  session: {
    id: string;
    name: string;
    date: string;
    objective: string;
    durationMinutes: number;
    intensity: string;
    blocks: Array<{
      type: string;
      name: string;
      durationMinutes: number;
    }>;
  };
  microcycle: {
    id: string;
    name: string;
    weekStart: string;
    matchDay: string;
    objective: string;
    slots: Array<{
      day: string;
      focus: string;
      intensity: string;
      exercisesCount: number;
    }>;
  };
  mesocycle: {
    id: string;
    name: string;
    period: string;
    startDate: string;
    endDate: string;
    goal: string;
  };
  evaluation: {
    id: string;
    sessionName: string;
    rpeRating: number;
    perceivedIntensity: string;
    objectivesMet: boolean;
    notes: string;
  };
  backupPackage: {
    filename: string;
    entitiesCount: number;
    format: "json" | "csv";
    timestamp: string;
  };
}

export function generateUserDemoWorkflow(): DemoUserWorkflow {
  const nowISO = new Date().toISOString();

  return {
    coach: {
      name: "Carlos Méndez",
      role: "Entrenador Principal",
      email: "carlos.mendez@planeofut.app",
      teamName: "Olympic Alevín A",
    },
    team: {
      id: "team-alevin-a",
      name: "Olympic Alevín A",
      category: "Alevín (10-11 años)",
      season: "2026/2027",
      playersCount: 12,
    },
    roster: [
      { id: "pl-1", name: "Marcos Sanz", number: 1, position: "Portero", status: "disponible" },
      { id: "pl-2", name: "Mateo Fernández", number: 4, position: "Defensa Central", status: "disponible" },
      { id: "pl-3", name: "Lucas Gómez", number: 3, position: "Lateral Izquierdo", status: "disponible" },
      { id: "pl-4", name: "Hugo Ruiz", number: 2, position: "Lateral Derecho", status: "disponible" },
      { id: "pl-5", name: "Adrián Morales", number: 6, position: "Medio Centro (Pivote)", status: "disponible" },
      { id: "pl-6", name: "Pablo Torres", number: 8, position: "Interior Izquierdo", status: "disponible" },
      { id: "pl-7", name: "Diego Navarro", number: 10, position: "Interior Derecho", status: "lesionado" },
      { id: "pl-8", name: "Iker Castro", number: 7, position: "Extremo Izquierdo", status: "disponible" },
      { id: "pl-9", name: "Álvaro Vega", number: 11, position: "Extremo Derecho", status: "disponible" },
      { id: "pl-10", name: "Daniel Serrano", number: 9, position: "Delantero Centro", status: "disponible" },
      { id: "pl-11", name: "Leo Blanco", number: 12, position: "Centrocampista", status: "disponible" },
      { id: "pl-12", name: "Nicolás Marín", number: 13, position: "Portero Suplente", status: "disponible" },
    ],
    injury: {
      id: "inj-01",
      playerName: "Diego Navarro",
      injuryType: "Esguince de tobillo grado I",
      startDate: "2026-09-10",
      estimatedReturn: "2026-09-24",
      notes: "En fase de fisioterapia y movilidad sin balón.",
    },
    exercise: {
      id: "oso-inf-02",
      name: "Juego de Posición 3x3 + 4 Comodines (1-4-3-3)",
      category: "juego_posicion",
      gamePhase: "ataque",
      intensity: "media",
      objectiveAttack: "Generar triángulos de pase entre pivote, interiores y extremos.",
      objectiveDefense: "Basculación rápida y cierre de líneas de pase interiores.",
      provocationRule: "12 pases seguidos o pase filtrado entre líneas vale 1 punto.",
      continuityRule: "Tras pérdida, el equipo perdedor pasa inmediatamente a presionar.",
    },
    session: {
      id: "session-s04",
      name: "Sesión 04 · Amplitud y Primer Pase Orientado",
      date: "2026-09-16",
      objective: "Fijar por dentro con pivote y abrir a bandas en velocidad para centro y remate.",
      durationMinutes: 75,
      intensity: "alta",
      blocks: [
        { type: "calentamiento", name: "Rondo 5x2 Superioridad con Apoyo Interior", durationMinutes: 12 },
        { type: "situacion_tactica", name: "Juego de Posición 3x3 + 4 Comodines", durationMinutes: 20 },
        { type: "espacio_reducido", name: "Espacio Reducido 4x4 + Puertas Laterales", durationMinutes: 20 },
        { type: "partido_integracion", name: "Partido Condicionado 7x7 en Campo Reducido", durationMinutes: 23 },
      ],
    },
    microcycle: {
      id: "mc-week-03",
      name: "Microciclo Semana 3 · Carga Táctica Media-Alta",
      weekStart: "2026-09-15",
      matchDay: "domingo",
      objective: "Consolidación de la salida jugada y repliegue tras pérdida.",
      slots: [
        { day: "Martes (MD-4)", focus: "Activación y Rondo 6x0", intensity: "baja", exercisesCount: 2 },
        { day: "Miércoles (MD-3)", focus: "Fuerza, Duelos 1x1 y Reducidos", intensity: "alta", exercisesCount: 3 },
        { day: "Viernes (MD-2)", focus: "Táctico Colectivo y ABP", intensity: "media", exercisesCount: 3 },
        { day: "Sábado (MD-1)", focus: "Activación pre-partido", intensity: "baja", exercisesCount: 2 },
        { day: "Domingo (MD)", focus: "Partido de Competición vs AD Rayo", intensity: "máxima", exercisesCount: 0 },
      ],
    },
    mesocycle: {
      id: "meso-01",
      name: "Mesociclo 1 · Fundamentos Posicionales y Salida Elaborada",
      period: "Pretemporada / Inicio de Competición",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      goal: "Establecer la estructura 1-4-3-3 y automatizar apoyos al poseedor del balón.",
    },
    evaluation: {
      id: "eval-s04",
      sessionName: "Sesión 04 · Amplitud y Primer Pase Orientado",
      rpeRating: 7.5,
      perceivedIntensity: "alta",
      objectivesMet: true,
      notes: "Excelente circulación por bandas. Ajustar tiempos de llegada al remate en segundo palo.",
    },
    backupPackage: {
      filename: "planeofut_backup_carlos_mendez_20260914.json",
      entitiesCount: 24,
      format: "json",
      timestamp: nowISO,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("demo-user-simulation.ts")) {
  const demo = generateUserDemoWorkflow();
  console.log("==================================================================");
  console.log(`🚀 DEMO USER WORKFLOW SIMULATION: ${demo.coach.name}`);
  console.log(`Equipo: ${demo.team.name} (${demo.team.category})`);
  console.log(`Jugadores registrados: ${demo.roster.length} | Lesionados: 1 (${demo.injury.playerName})`);
  console.log(`Ejercicio OSO clave: ${demo.exercise.name}`);
  console.log(`Sesión diseñada: ${demo.session.name} (${demo.session.durationMinutes} min)`);
  console.log(`Microciclo activo: ${demo.microcycle.name}`);
  console.log(`Mesociclo: ${demo.mesocycle.name}`);
  console.log(`Evaluación post-sesión: RPE ${demo.evaluation.rpeRating} | Objetivos cumplidos: ${demo.evaluation.objectivesMet}`);
  console.log(`Paquete Backup generado: ${demo.backupPackage.filename} (${demo.backupPackage.entitiesCount} entidades)`);
  console.log("==================================================================");
}
