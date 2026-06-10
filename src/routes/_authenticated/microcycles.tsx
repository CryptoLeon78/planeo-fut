import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { CalendarRange } from "lucide-react";

export const Route = createFileRoute("/_authenticated/microcycles")({
  component: MicrocyclesPage,
});

function MicrocyclesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Microciclos</h1>
        <p className="text-sm text-muted-foreground">3 sesiones + partido (sábado o domingo). Próximamente.</p>
      </div>
      <Card className="grid place-items-center p-16 text-center">
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><CalendarRange className="h-6 w-6" /></div>
        <p className="font-medium">Planificador semanal en construcción</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Pronto podrás encadenar 3 sesiones + partido con vista de carga, recomendaciones por día y vista de mesociclo.
        </p>
      </Card>
    </div>
  );
}
