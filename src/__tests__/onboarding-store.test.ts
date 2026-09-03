import { beforeEach, describe, expect, it } from 'vitest';
import { ONBOARDING_STEPS, onboardingStore } from '@/stores/onboarding-store';

describe('onboardingStore', () => {
  beforeEach(() => {
    localStorage.clear();
    onboardingStore.reset();
  });

  it('recorre los pasos y los marca como completados', () => {
    expect(onboardingStore.getState().currentStepIndex).toBe(0);
    onboardingStore.next();
    expect(onboardingStore.getState().currentStepIndex).toBe(1);
    expect(onboardingStore.getState().completedSteps).toContain(ONBOARDING_STEPS[0].id);
  });

  it('permite saltar a un paso y finalizar el tutorial', () => {
    onboardingStore.goTo(ONBOARDING_STEPS.length - 1);
    expect(onboardingStore.getState().currentStepIndex).toBe(ONBOARDING_STEPS.length - 1);
    onboardingStore.next();
    expect(onboardingStore.getState().isActive).toBe(false);
    expect(onboardingStore.getState().dismissed).toBe(true);
  });

  it('persiste el estado para el siguiente inicio', () => {
    onboardingStore.dismiss();
    const stored = JSON.parse(localStorage.getItem('planeofut_onboarding_v1') ?? '{}');
    expect(stored.dismissed).toBe(true);
  });
});
