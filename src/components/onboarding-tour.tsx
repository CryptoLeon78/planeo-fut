"use client";

import { useEffect } from "react";
import { useRouter, useNavigate } from "@tanstack/react-router";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboarding, ONBOARDING_STEPS } from "@/stores/onboarding-store";
import { cn } from "@/lib/utils";

export function OnboardingTour() {
  const { isActive, dismissed, currentStep, currentStepIndex, totalSteps, isLastStep, progress, next, goTo, dismiss } =
    useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && currentStep && currentStep.targetRoute) {
      navigate({ to: currentStep.targetRoute as any });
    }
  }, [currentStepIndex, isActive, currentStep, navigate]);

  useEffect(() => {
    if (!isActive || !currentStep?.anchor) return;
    const timer = window.setTimeout(() => {
      const target = document.querySelector(currentStep.anchor!);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("onboarding-highlight");
    }, 250);
    return () => {
      window.clearTimeout(timer);
      document.querySelectorAll(".onboarding-highlight").forEach((element) => element.classList.remove("onboarding-highlight"));
    };
  }, [currentStep, isActive]);

  if (!isActive || dismissed || !currentStep) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Paso de onboarding: ${currentStep.title}`}
    >
      <Card className="border-primary/30 bg-card shadow-2xl ring-1 ring-primary/20">
        {/* Progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-t-xl bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">
                Paso {currentStepIndex + 1} de {totalSteps}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0"
              onClick={dismiss}
              aria-label="Cerrar tutorial de onboarding"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Content */}
          <h3 className="mb-2 text-base font-semibold leading-snug">{currentStep.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{currentStep.description}</p>

          {/* Step dots */}
          <div className="mt-4 flex items-center gap-1.5" aria-label="Pasos del tutorial">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir al paso ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === currentStepIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-xs" onClick={dismiss}>
              Saltar tutorial
            </Button>
            <Button size="sm" onClick={next} className="gap-1.5">
              {isLastStep ? (
                "¡Empezar ahora!"
              ) : (
                <>
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
