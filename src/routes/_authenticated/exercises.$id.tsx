import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercise-form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/exercises/$id")({
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: ex, isLoading } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("*").eq("id", id).single();
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!ex) return <p className="text-sm text-muted-foreground">No encontrado.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate({ to: "/exercises" })}><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Button>
        <Button
          onClick={() => navigate({ to: "/sessions/new", search: { fromExercise: id } })}
        >
          <ClipboardPlus className="mr-1 h-4 w-4" /> Crear sesión con este ejercicio
        </Button>
      </div>
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Editar ejercicio</h1>
        <ExerciseForm initial={ex} onSaved={() => navigate({ to: "/exercises" })} />
      </Card>
    </div>
  );
}

