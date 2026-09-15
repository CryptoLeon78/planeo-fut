import { describe, it, expect, beforeEach } from "vitest";
import { onboardingStore, ONBOARDING_STEPS } from "@/stores/onboarding-store";

describe("Onboarding Store", () => {
  beforeEach(() => {
    onboardingStore.reset();
  });

  it("starts at step 0 and isActive after reset", () => {
    const state = onboardingStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.currentStepIndex).toBe(0);
    expect(state.completedSteps).toHaveLength(0);
    expect(state.dismissed).toBe(false);
  });

  it("advances to next step and marks current as completed", () => {
    onboardingStore.next();
    const state = onboardingStore.getState();
    expect(state.currentStepIndex).toBe(1);
    expect(state.completedSteps).toContain(ONBOARDING_STEPS[0].id);
  });

  it("dismiss deactivates the tour", () => {
    onboardingStore.dismiss();
    const state = onboardingStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.dismissed).toBe(true);
  });

  it("goTo jumps to the correct step index", () => {
    onboardingStore.goTo(3);
    expect(onboardingStore.getState().currentStepIndex).toBe(3);
  });

  it("completing last step deactivates tour and sets dismissed", () => {
    // Walk through all steps
    const totalSteps = ONBOARDING_STEPS.length;
    for (let i = 0; i < totalSteps; i++) {
      onboardingStore.next();
    }
    const state = onboardingStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.dismissed).toBe(true);
    expect(state.completedSteps).toHaveLength(totalSteps);
  });

  it("notifies subscribers on state change", () => {
    let called = 0;
    const unsub = onboardingStore.subscribe(() => { called++; });
    onboardingStore.next();
    onboardingStore.dismiss();
    expect(called).toBe(2);
    unsub();
  });
});
