export interface OsoExercise {
  id: string;
  name: string;
  category: "rondo" | "espacio_reducido" | "juego_posicion" | "situacion_tactica" | "partido_condicionado";
  gamePhase: "ataque" | "defensa" | "transicion_ofensiva" | "transicion_defensiva" | "mixto";
  intensity: "baja" | "media" | "alta";
  ageStage: "6-7" | "8-9" | "10-13" | "14-18";
  ageStageLabel: "Prebenjamín (6-7)" | "Benjamín (8-9)" | "Alevín/Infantil (10-13)" | "Cadete/Juvenil (14-18)";
  playersCount: string;
  dimensions: string;
  durationMinutes: number;
  description: string;
  objectiveAttack: string;
  objectiveDefense: string;
  provocationRule?: string;
  continuityRule?: string;
  withdrawalRule?: string;
  focosFutbolisticos?: string;
  cincoP?: string;
}

export const OSO_EXERCISES: OsoExercise[] = [
  // ─── PREBENJAMÍN (6-7 AÑOS) ─────────────────────────────────────────────
  {
    id: "oso-pb-01",
    name: "Rondo 6x0 con Cambio de Zona",
    category: "rondo",
    gamePhase: "ataque",
    intensity: "media",
    ageStage: "6-7",
    ageStageLabel: "Prebenjamín (6-7)",
    playersCount: "6 jugadores",
    dimensions: "20x20m",
    durationMinutes: 8,
    description: "6 atacantes cada uno con un balón conducen dentro del cuadrado tratando de no chocar ni perder el control a la señal del entrenador.",
    objectiveAttack: "Encontrar el primer pase que mejora la siguiente relación y conectar después.",
    objectiveDefense: "Interceptar y temporizar la entrada.",
    provocationRule: "Reconocer con 1 punto cuando el primer pase mejora la siguiente relación.",
    continuityRule: "Reanudación rápida desde el equipo que corresponda en menos de 10 segundos.",
    withdrawalRule: "Retirar el bonus y comprobar si siguen apareciendo la orientación y la conexión.",
    focosFutbolisticos: "Percepción + Posición",
    cincoP: "Participación + Protagonismo",
  },
  {
    id: "oso-pb-02",
    name: "Espacio Reducido 2x2 + 2 Porteros (Puertas Laterales)",
    category: "espacio_reducido",
    gamePhase: "mixto",
    intensity: "alta",
    ageStage: "6-7",
    ageStageLabel: "Prebenjamín (6-7)",
    playersCount: "4 jugadores + 2 porteros",
    dimensions: "22x18m",
    durationMinutes: 12,
    description: "Cada equipo ataca y defiende una línea de fondo; el atacante intenta progresar y finalizar atravesando conduciendo la línea de fondo adversaria.",
    objectiveAttack: "Llegar a la finalización con ventaja suficiente y elegir cuándo rematar o continuar.",
    objectiveDefense: "Evitar la progresión en el juego y proteger el centro.",
    provocationRule: "Valorar doble el gol cuando la finalización nace de una ventaja clara.",
    continuityRule: "Tras gol saque del entrenador al equipo correspondiente.",
    withdrawalRule: "Quitar la condición del gol doble y comprobar si la ventaja sigue guiando.",
    focosFutbolisticos: "Percepción + Posición",
    cincoP: "Placer + Protagonismo",
  },

  // ─── BENJAMÍN (8-9 AÑOS) ────────────────────────────────────────────────
  {
    id: "oso-bj-01",
    name: "Rondo 5x2 (Superioridad con Apoyo Interior)",
    category: "rondo",
    gamePhase: "transicion_ofensiva",
    intensity: "media",
    ageStage: "8-9",
    ageStageLabel: "Benjamín (8-9)",
    playersCount: "5 atacantes + 2 defensores",
    dimensions: "8x8m",
    durationMinutes: 8,
    description: "4 atacantes en lados exteriores y 1 interior tratan de mantener la posesión contra 2 defensores que buscan interceptar.",
    objectiveAttack: "Relacionarse con el espacio para conservar apoyos y opciones de avance sin amontonarse.",
    objectiveDefense: "Escalonarse: uno presiona al poseedor, el otro realiza cobertura.",
    provocationRule: "Pase entre los 2 defensores vale doble; 10 pases seguidos repiten los defensivos.",
    continuityRule: "Tras pérdida, el defensor que recupera pasa a atacar y el perdedor a defender.",
    withdrawalRule: "Quitar la puntuación doble y observar si la amplitud permanece.",
    focosFutbolisticos: "Posición + Posesión",
    cincoP: "Presencia + Participación",
  },
  {
    id: "oso-bj-02",
    name: "Espacio Reducido 3x3 (Avanzar por Bandas)",
    category: "espacio_reducido",
    gamePhase: "ataque",
    intensity: "alta",
    ageStage: "8-9",
    ageStageLabel: "Benjamín (8-9)",
    playersCount: "6 jugadores + 2 porteros",
    dimensions: "30x20m",
    durationMinutes: 12,
    description: "Se divide el campo en 2 zonas iguales; en cada una se mantiene superioridad 3x2 con rotaciones continuas.",
    objectiveAttack: "Progresar de una zona a otra asociándose con el jugador libre en banda.",
    objectiveDefense: "Evitar la progresión cerrando carriles interiores.",
    provocationRule: "5 pases seguidos + cambio de zona suma 1 punto.",
    continuityRule: "Tras fuera, saque rápido del entrenador para mantener alta intensidad.",
    withdrawalRule: "Eliminar zonas fijas y comprobar si el equipo mantiene la amplitud voluntariamente.",
    focosFutbolisticos: "Percepción + Posición",
    cincoP: "Protagonismo + Propósito",
  },

  // ─── ALEVÍN / INFANTIL (10-13 AÑOS) ─────────────────────────────────────
  {
    id: "oso-inf-01",
    name: "Rondo 4x2 + 1 Portero (Finalización en Ruptura)",
    category: "rondo",
    gamePhase: "transicion_ofensiva",
    intensity: "alta",
    ageStage: "10-13",
    ageStageLabel: "Alevín/Infantil (10-13)",
    playersCount: "4 atacantes + 2 defensores + 1 portero",
    dimensions: "12x12m (zona central)",
    durationMinutes: 10,
    description: "El equipo atacante mantiene la posesión a máximo 2 toques; tras 5 pases seguidos, un jugador desmarca en ruptura para buscar 1xP.",
    objectiveAttack: "Fijar por dentro y atacar el espacio a la espalda de la línea defensiva.",
    objectiveDefense: "Apretar al poseedor para impedir el pase en profundidad.",
    provocationRule: "Finalización tras desmarque de ruptura en menos de 5 segundos vale doble.",
    continuityRule: "Tras parada o gol, reinicio inmediato en el cuadro central.",
    withdrawalRule: "Permitir desmarque sin conteo de pases previo.",
    focosFutbolisticos: "Percepción + Presión",
    cincoP: "Protagonismo + Placer",
  },
  {
    id: "oso-inf-02",
    name: "Juego de Posición 3x3 + 4 Comodines (1-4-3-3)",
    category: "juego_posicion",
    gamePhase: "ataque",
    intensity: "media",
    ageStage: "10-13",
    ageStageLabel: "Alevín/Infantil (10-13)",
    playersCount: "6 jugadores + 4 comodines",
    dimensions: "18x24m",
    durationMinutes: 18,
    description: "Estructura posicional basada en el sistema 1-4-3-3: comodines en laterales, pivote e interior. El equipo atacante busca mantener la posesión a 2 toques.",
    objectiveAttack: "Generar triángulos de pase entre pivote, interiores y extremos.",
    objectiveDefense: "Basculación rápida y cierre de líneas de pase interiores.",
    provocationRule: "12 pases seguidos o pase filtrado entre líneas vale 1 punto.",
    continuityRule: "Tras pérdida, el equipo perdedor pasa inmediatamente a presionar.",
    withdrawalRule: "Eliminar la bonificación por pase filtrado.",
    focosFutbolisticos: "Posición + Posesión",
    cincoP: "Presencia + Participación",
  },
  {
    id: "oso-inf-03",
    name: "Situación Táctica 2x1 + 1 Portero (Atracción y Salida)",
    category: "situacion_tactica",
    gamePhase: "ataque",
    intensity: "alta",
    ageStage: "10-13",
    ageStageLabel: "Alevín/Infantil (10-13)",
    playersCount: "2 atacantes + 1 defensor + 1 portero",
    dimensions: "30x20m",
    durationMinutes: 10,
    description: "2 centrales inician desde saque del portero para superar la presión de 1 delantero e incorporar conducción hacia mini-porterías.",
    objectiveAttack: "Fijar al defensor con conducción antes de soltar el pase al compañero libre.",
    objectiveDefense: "Orientar la carrera defensiva para tapar el perfil hábil y la línea de pase.",
    provocationRule: "Superar al defensor mediante pared o pase tras fijación vale gol doble.",
    continuityRule: "Si el defensor recupera, puede finalizar en la portería del portero.",
    withdrawalRule: "Juego libre sin restricción de zonas de inicio.",
    focosFutbolisticos: "Percepción + Posición",
    cincoP: "Protagonismo + Propósito",
  },

  // ─── CADETE / JUVENIL (14-18 AÑOS) ──────────────────────────────────────
  {
    id: "oso-cj-01",
    name: "Posesión Tricolor 8x4 (Tres Equipos)",
    category: "juego_posicion",
    gamePhase: "transicion_defensiva",
    intensity: "alta",
    ageStage: "14-18",
    ageStageLabel: "Cadete/Juvenil (14-18)",
    playersCount: "12 jugadores (3 equipos de 4)",
    dimensions: "24x20m",
    durationMinutes: 15,
    description: "Dos equipos de 4 se unen para conservar el balón contra 1 equipo de 4 que presiona. El equipo que pierde la posesión pasa a presionar inmediatamente.",
    objectiveAttack: "Mantener la posesión mediante circulaciones rápidas a 1-2 toques y cambios de orientación.",
    objectiveDefense: "Presión tras pérdida asfixiante e interceptación en bloque alto.",
    provocationRule: "El equipo defensivo que recupera y conecta 2 pases sale del centro.",
    continuityRule: "Reinicio instantáneo desde el balón disponible más cercano.",
    withdrawalRule: "Juego sin límite de toques.",
    focosFutbolisticos: "Presión + Posesión",
    cincoP: "Presencia + Protagonismo",
  },
  {
    id: "oso-cj-02",
    name: "Partido Condicionado 11x11 (Salida Bajo Presión Alta)",
    category: "partido_condicionado",
    gamePhase: "mixto",
    intensity: "alta",
    ageStage: "14-18",
    ageStageLabel: "Cadete/Juvenil (14-18)",
    playersCount: "22 jugadores",
    dimensions: "Medio campo a campo completo",
    durationMinutes: 25,
    description: "Equipo A aplica el modelo 1-4-3-3 de salida elaborada contra Equipo B en presión alta condicionada.",
    objectiveAttack: "Superar la primera línea de presión mediante tercer hombre o pase diagonal a extremos.",
    objectiveDefense: "Organización en bloque alto, marcaje al hombre en zona de inicio.",
    provocationRule: "Si el equipo en salida conecta 10 pases en campo propio y supera la medular, obtiene 2 goles.",
    continuityRule: "Todos los saques inician con el portero en corto.",
    withdrawalRule: "Juego libre sin bonificación de puntos.",
    focosFutbolisticos: "Percepción + Presión + Posición",
  },
];

export function getOsoExerciseById(id: string): OsoExercise | undefined {
  return OSO_EXERCISES.find((ex) => ex.id === id);
}
