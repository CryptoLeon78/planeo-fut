import { useSyncExternalStore } from "react";
import { appStore } from "./app-store";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetRoute: string;
  anchor?: string; // CSS selector para el elemento a resaltar
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a PlaneoFUT! 👋",
    description:
      "Tu plataforma profesional de planificación deportiva. En 5 pasos rápidos te enseñamos todo lo que necesitas para empezar.",
    targetRoute: "/dashboard",
  },
  {
    id: "exercises",
    title: "📚 Biblioteca de Ejercicios",
    description:
      "Aquí encontrarás todos los ejercicios disponibles. Puedes filtrarlos por fase del juego e intensidad, marcar favoritos y crear los tuyos propios.",
    targetRoute: "/exercises",
    anchor: "[data-onboarding='exercises-list']",
  },
  {
    id: "sessions",
    title: "📋 Sesiones de Entrenamiento",
    description:
      "Combina ejercicios en bloques para crear sesiones completas. Organiza por objetivo, intensidad y duración.",
    targetRoute: "/sessions",
    anchor: "[data-onboarding='sessions-list']",
  },
  {
    id: "microcycles",
    title: "🔄 Microciclos Semanales",
    description:
      "Agrupa sesiones en microciclos de 7 días. Puedes duplicar microciclos enteros para replicar semanas de entrenamiento.",
    targetRoute: "/microcycles",
    anchor: "[data-onboarding='microcycles-list']",
  },
  {
    id: "calendar",
    title: "📅 Calendario de Planificación",
    description:
      "Visualiza y planifica tus sesiones en el tiempo. El calendario te da una vista semanal de toda la carga de entrenamiento.",
    targetRoute: "/calendar",
    anchor: "[data-onboarding='calendar-view']",
  },
  {
    id: "team",
    title: "Gestiona tu equipo",
    description: "Añade jugadores, registra lesiones y controla su disponibilidad para cada semana.",
    targetRoute: "/team",
    anchor: "[data-onboarding='team-view']",
  },
];

export interface OnboardingState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: string[];
  dismissed: boolean;
}

const ONBOARDING_KEY = "planeofut_onboarding_v1";

function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") {
    return { isActive: false, currentStepIndex: 0, completedSteps: [], dismissed: false };
  }
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) {
      // First visit → activate onboarding
      return { isActive: true, currentStepIndex: 0, completedSteps: [], dismissed: false };
    }
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return { isActive: true, currentStepIndex: 0, completedSteps: [], dismissed: false };
  }
}

function persistOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch {
    // La navegación debe seguir funcionando aunque el almacenamiento esté bloqueado.
  }
}

let currentOnboarding: OnboardingState = loadOnboardingState();
const onboardingListeners = new Set<() => void>();

function notifyOnboarding() {
  onboardingListeners.forEach((l) => l());
}

export const onboardingStore = {
  getState(): OnboardingState {
    return currentOnboarding;
  },

  subscribe(listener: () => void): () => void {
    onboardingListeners.add(listener);
    return () => onboardingListeners.delete(listener);
  },

  start() {
    currentOnboarding = { ...currentOnboarding, isActive: true, currentStepIndex: 0, dismissed: false };
    persistOnboardingState(currentOnboarding);
    notifyOnboarding();
  },

  next() {
    const step = ONBOARDING_STEPS[currentOnboarding.currentStepIndex];
    const completedSteps = step
      ? [...new Set([...currentOnboarding.completedSteps, step.id])]
      : currentOnboarding.completedSteps;
    const nextIndex = currentOnboarding.currentStepIndex + 1;
    const isActive = nextIndex < ONBOARDING_STEPS.length;

    currentOnboarding = {
      ...currentOnboarding,
      currentStepIndex: nextIndex,
      completedSteps,
      isActive,
      dismissed: !isActive,
    };
    persistOnboardingState(currentOnboarding);
    notifyOnboarding();
  },

  goTo(stepIndex: number) {
    currentOnboarding = {
      ...currentOnboarding,
      currentStepIndex: Math.min(Math.max(0, stepIndex), ONBOARDING_STEPS.length - 1),
      isActive: true,
    };
    persistOnboardingState(currentOnboarding);
    notifyOnboarding();
  },

  dismiss() {
    currentOnboarding = { ...currentOnboarding, isActive: false, dismissed: true };
    persistOnboardingState(currentOnboarding);
    notifyOnboarding();
  },

  reset() {
    currentOnboarding = { isActive: true, currentStepIndex: 0, completedSteps: [], dismissed: false };
    persistOnboardingState(currentOnboarding);
    notifyOnboarding();
  },
};

export function useOnboarding() {
  const state = useSyncExternalStore(
    onboardingStore.subscribe,
    () => onboardingStore.getState(),
    () => ({ isActive: false, currentStepIndex: 0, completedSteps: [], dismissed: false })
  );

  const currentStep = ONBOARDING_STEPS[state.currentStepIndex] ?? null;
  const isLastStep = state.currentStepIndex === ONBOARDING_STEPS.length - 1;
  const progress = Math.round(((state.currentStepIndex) / ONBOARDING_STEPS.length) * 100);

  return {
    ...state,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    isLastStep,
    progress,
    start: onboardingStore.start,
    next: onboardingStore.next,
    goTo: onboardingStore.goTo,
    dismiss: onboardingStore.dismiss,
    reset: onboardingStore.reset,
  };
}
