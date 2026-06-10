import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { INTENSITIES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function duplicate(id: string) {
    const { data: src } = await supabase.from("sessions").select("*").eq("id", id).single();
    if (!src) return;
    const { data: blocks } = await supabase.from("session_blocks").select("*").eq("session_id", id);
    const { data: created, error } = await supabase.from("sessions").insert({
      owner_id: src.owner_id, team_id: src.team_id, name: `${src.name} (copia)`,
      session_date: null, objective: src.objective, weekly_focus: src.weekly_focus,
      intensity: src.intensity, duration_min: src.duration_min, notes: src.notes, is_template: src.is_template,
    }).select("id").single();
    if (error || !created) return toast.error(error?.message ?? "Error");

    if (blocks && blocks.length > 0) {
      const newBlocks = blocks.map((b: any) => ({
        session_id: created.id, block_type: b.block_type, name: b.name,
        position: b.position, duration_min: b.duration_min, notes: b.notes,
      }));
      const { data: insertedBlocks } = await supabase.from("session_blocks").insert(newBlocks).select("id,position,block_type");
      // Copy exercises per block (matching by position+type)
      if (insertedBlocks) {
        for (const ob of blocks) {
          const nb = insertedBlocks.find((x: any) => x.position === ob.position && x.block_type === ob.block_type);
          if (!nb) continue;
          const { data: exs } = await supabase.from("session_block_exercises").select("*").eq("block_id", ob.id);
          if (exs?.length) {
            await supabase.from("session_block_exercises").insert(
              exs.map((e: any) => ({ block_id: nb.id, exercise_id: e.exercise_id, position: e.position, duration_override: e.duration_override, notes: e.notes }))
            );
          }
        }
      }
    }
    toast.success("Sesión duplicada");
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta sesión?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesiones</h1>
          <p className="text-sm text-muted-foreground">Agrupa ejercicios en bloques estructurados.</p>
        </div>
        <Button asChild><Link to="/sessions/new"><Plus className="mr-1 h-4 w-4" /> Nueva sesión</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s: any) => (
            <Card key={s.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <Link to="/sessions/$id" params={{ id: s.id }} className="font-semibold hover:text-primary">{s.name}</Link>
                {s.is_template && <Badge variant="outline">Plantilla</Badge>}
              </div>
              {s.objective && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.objective}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.intensity && <Badge variant="secondary">{labelOf(INTENSITIES, s.intensity)}</Badge>}
                {s.duration_min && <Badge variant="outline">{s.duration_min}′</Badge>}
                {s.session_date && <Badge variant="outline">{new Date(s.session_date).toLocaleDateString("es-ES")}</Badge>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/sessions/$id" params={{ id: s.id }}>Abrir</Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => duplicate(s.id)} aria-label="Duplicar"><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <p className="font-medium">Aún no tienes sesiones</p>
          <p className="mt-1 text-sm text-muted-foreground">Combina ejercicios en bloques: calentamiento, parte principal, juego y vuelta a la calma.</p>
          <Button className="mt-4" asChild><Link to="/sessions/new"><Plus className="mr-1 h-4 w-4" /> Crear sesión</Link></Button>
        </Card>
      )}
    </div>
  );
}
