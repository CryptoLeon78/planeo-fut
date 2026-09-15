export interface OsoSessionPart {
  name: string;
  type: "calentamiento" | "espacio_reducido" | "juego_posicion" | "situacion_tactica" | "partido_integracion";
  durationMinutes: number;
  dimensions: string;
  playersFormat: string;
  description: string;
  provocacion?: string;
  continuidad?: string;
}

export interface OsoSessionTemplate {
  id: string;
  title: string;
  subtitle: string;
  ageGroup: "6-7" | "8-9" | "10-13" | "14-18";
  ageGroupLabel: string;
  season: "Primavera (Explorar)" | "Verano (Experimentar)" | "Otoño (Comprender)" | "Invierno (Integrar)";
  phase: "Ataque" | "Defensa" | "Transición" | "Mixto";
  totalDurationMinutes: number;
  parts: OsoSessionPart[];
  closingQuestion: string;
}

export const OSO_TEMPLATES: OsoSessionTemplate[] = [
  {
    id: "oso-tpl-6-7-01",
    title: "Prebenjamín S01 · Primer Pase Orientado + Conectar",
    subtitle: "Estación Primavera: Explorar · Formato Fútbol 7/8",
    ageGroup: "6-7",
    ageGroupLabel: "Prebenjamín (6-7 años)",
    season: "Primavera (Explorar)",
    phase: "Ataque",
    totalDurationMinutes: 60,
    parts: [
      {
        name: "1. Rondo 6x0 (Control y Conducción)",
        type: "calentamiento",
        durationMinutes: 8,
        dimensions: "20x20m",
        playersFormat: "6x0",
        description: "6 atacantes con un balón conducen dentro del cuadrado tratando de no chocar ni perder el control.",
        provocacion: "Reconocer con un punto cuando el primer pase mejora la siguiente relación.",
        continuidad: "Reanudación rápida desde el equipo que corresponda."
      },
      {
        name: "2. Espacio Reducido 1 (Conducción a Línea de Fondo)",
        type: "espacio_reducido",
        durationMinutes: 12,
        playersFormat: "2x2 + 2 porteros",
        dimensions: "22x18m",
        description: "Cada equipo ataca y defiende una línea de fondo; el atacante intenta progresar conduciendo la línea adversaria.",
        provocacion: "Valorar doble el gol cuando la finalización nace de una ventaja clara.",
        continuidad: "Saque del portero tras gol o fuera."
      },
      {
        name: "3. Espacio Reducido 2 (Zona Marcada 1xPortero)",
        type: "espacio_reducido",
        durationMinutes: 15,
        playersFormat: "2x2 + 2 porteros",
        dimensions: "32x20m",
        description: "Se delimitan 2 zonas a 10m de las líneas de fondo. Entrar conduciendo en la zona adversaria para buscar 1xP.",
        provocacion: "Doble valor si el gol proviene de un pase orientado previo.",
        continuidad: "Reanudación rápida desde la línea asignada."
      },
      {
        name: "4. Partido de Integración 4x4",
        type: "partido_integracion",
        durationMinutes: 20,
        playersFormat: "4x4 + 2 porteros",
        dimensions: "35x25m",
        description: "El equipo atacante intenta progresar en el juego y finalizar tirando en la portería adversaria.",
        provocacion: "Puntuación doble si la jugada se inicia con orientación clara en campo propio.",
        continuidad: "Saque de centro estándar."
      }
    ],
    closingQuestion: "¿Qué espacio se vuelve útil cuando el equipo abre el juego?"
  },

  {
    id: "oso-tpl-8-9-01",
    title: "Benjamín S05 · Amplitud como Función Espacial",
    subtitle: "Estación Verano: Experimentar · Formato Fútbol 8",
    ageGroup: "8-9",
    ageGroupLabel: "Benjamín (8-9 años)",
    season: "Verano (Experimentar)",
    phase: "Transición",
    totalDurationMinutes: 60,
    parts: [
      {
        name: "1. Rondo 5x2 (Superioridad con Apoyo Interior)",
        type: "calentamiento",
        durationMinutes: 10,
        dimensions: "8x8m",
        playersFormat: "5x2",
        description: "4 atacantes exteriores + 1 interior contra 2 defensores que buscan interceptar.",
        provocacion: "Pase entre los dos defensores suma 2 puntos.",
        continuidad: "Pérdida exige cambio inmediato de rol."
      },
      {
        name: "2. Juego de Posición 3x3 + 2 Comodines",
        type: "juego_posicion",
        durationMinutes: 15,
        dimensions: "20x20m",
        playersFormat: "3x3 + 2 comodines",
        description: "Posesión en espacio delimitado alternando pases cortos y cambios de carril a comodines exteriores.",
        provocacion: "8 pases seguidos suma 1 gol.",
        continuidad: "Entrenador reintroduce el balón inmediatamente tras fuera."
      },
      {
        name: "3. Partido Condicionado (Dos Zonas)",
        type: "partido_integracion",
        durationMinutes: 25,
        dimensions: "40x25m",
        playersFormat: "5x5 + 2 porteros",
        description: "Campo dividido en 2 zonas. El equipo debe conectar con el jugador en banda antes de poder finalizar.",
        provocacion: "Gol válido solo si proviene de un centro desde carril lateral.",
        continuidad: "Saque del portero en corto."
      }
    ],
    closingQuestion: "¿Qué información del rival cambia la posición que elegimos?"
  },

  {
    id: "oso-tpl-10-13-01",
    title: "Alevín/Infantil M1.1 · Abrir para Ver (Puertas Laterales)",
    subtitle: "Estación Otoño: Comprender · Formato Fútbol 7/11",
    ageGroup: "10-13",
    ageGroupLabel: "Alevín/Infantil (10-13 años)",
    season: "Otoño (Comprender)",
    phase: "Ataque",
    totalDurationMinutes: 75,
    parts: [
      {
        name: "1. Rondo 4x2 + 1 Portero (Ruina o Ruptura)",
        type: "calentamiento",
        durationMinutes: 10,
        dimensions: "12x12m",
        playersFormat: "4x2 + 1P",
        description: "Mantener la posesión en el cuadrado central y buscar pase filtrado en ruptura tras 5 pases.",
        provocacion: "Gol en menos de 5s tras ruptura vale doble.",
        continuidad: "Reinicio instantáneo."
      },
      {
        name: "2. Juego 1 · Puertas Laterales (4x4 + 2 apoyos)",
        type: "situacion_tactica",
        durationMinutes: 16,
        dimensions: "20x20m",
        playersFormat: "4x4 + 2 apoyos",
        description: "Dos metas enfrentadas y dos puertas laterales. Elegir entre abrir, mantener el exterior o volver a participar por dentro.",
        provocacion: "Punto extra cuando se cambia de carril tras conectar con un compañero.",
        continuidad: "Saque del portero en menos de 10 segundos."
      },
      {
        name: "3. Juego 2 · Cruce de Carriles (5x5 + 2 apoyos)",
        type: "situacion_tactica",
        durationMinutes: 18,
        dimensions: "25x20m",
        playersFormat: "5x5 + 2 apoyos",
        description: "Dos carriles exteriores y uno interior. El balón puede cambiar de lado en cualquier momento.",
        provocacion: "Puerta lateral suma solo cuando se mantiene una amenaza en el lado contrario.",
        continuidad: "Reanudación veloz."
      },
      {
        name: "4. Partido Condicionado (Isla Central)",
        type: "partido_integracion",
        durationMinutes: 25,
        dimensions: "50x35m",
        playersFormat: "7x7 + 2 porteros",
        description: "Una pequeña zona central concentra oposición. El equipo decide cuándo entrar y cuándo salir para conservar opción exterior.",
        provocacion: "Gol vale doble si se origina en amplitud previa.",
        continuidad: "Juego libre sin interrupciones pasivas."
      }
    ],
    closingQuestion: "¿Qué cambió cuando apareció la posibilidad de abrir para ver?"
  },

  {
    id: "oso-tpl-14-18-01",
    title: "Cadete/Juvenil M4.1 · Reaccionar al Cambio de Dueño",
    subtitle: "Estación Invierno: Integrar · Formato Fútbol 11",
    ageGroup: "14-18",
    ageGroupLabel: "Cadete/Juvenil (14-18 años)",
    season: "Invierno (Integrar)",
    phase: "Transición",
    totalDurationMinutes: 90,
    parts: [
      {
        name: "1. Rondo 6x2 con Transición de Zona",
        type: "calentamiento",
        durationMinutes: 12,
        dimensions: "24x12m (dos zonas de 12x12)",
        playersFormat: "6x2",
        description: "El equipo atacante mantiene la posesión y al 4º pase debe enviar a la zona contraria y cambiar todos de espacio.",
        provocacion: "Presión tras pérdida asfixiante en menos de 4s.",
        continuidad: "Balón en movimiento continuo."
      },
      {
        name: "2. Situación Táctica 2x1 + 1P (Salida bajo Presión Alta)",
        type: "situacion_tactica",
        durationMinutes: 20,
        dimensions: "1/3 de campo",
        playersFormat: "2 centrales + 1P vs 1 delantero",
        description: "Salida elaborada desde portería. Superar la primera línea de presión del delantero adversario en conducción o pase diagonal.",
        provocacion: "Si se supera la línea conduciendo, gol en mini-portería vale triple.",
        continuidad: "Reinicio tras finalización o robo."
      },
      {
        name: "3. Partido Condicionado 11x11 (Bloque Alto y Transición)",
        type: "partido_integracion",
        durationMinutes: 40,
        dimensions: "Campo completo",
        playersFormat: "11x11",
        description: "Equipo A en 1-4-3-3 de salida presionada vs Equipo B en bloque alto. Reacción inmediata tras cambio de posesión.",
        provocacion: "Recuperación en campo contrario exige tirar antes del 6º pase.",
        continuidad: "Reglamento oficial de competición."
      }
    ],
    closingQuestion: "¿Qué prioridad aparece en los primeros 5 segundos tras el cambio de dueño del balón?"
  }
];
