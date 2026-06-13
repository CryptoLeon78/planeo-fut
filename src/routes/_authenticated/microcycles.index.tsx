import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/microcycles/")({
  component: MicrocyclesPage,
});

function MicrocyclesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["microcycles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("microcycles")
        .select("id,name,week_start,match_day,weekly_objective,notes")
        .order("week_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function remove(id: string) {
    if (!confirm("¿Eliminar este microciclo?")) return;
    const { error } = await supabase.from("microcycles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["microcycles"] });
  }

  async function duplicate(id: string) {
    const { data: src } = await supabase.from("microcycles").select("*").eq("id", id).single();
    if (!src) return;
    const { data: slots } = await supabase.from("microcycle_slots").select("*").eq("microcycle_id", id);
    const nextStart = new Date(src.week_start);
    nextStart.setDate(nextStart.getDate() + 7);
    const ymd = nextStart.toISOString().slice(0, 10);
    const { data: created, error } = await (supabase.from("microcycles") as any).insert({
      owner_id: src.owner_id, team_id: src.team_id, mesocycle_id: src.mesocycle_id,
      name: `${src.name} (copia)`, week_start: ymd, match_day: src.match_day,
      weekly_objective: src.weekly_objective, notes: src.notes,
    }).select("id").single();
    if (error || !created) return toast.error(error?.message ?? "Error");
    if (slots?.length) {
      const diff = 7 * 86400000;
      await (supabase.from("microcycle_slots") as any).insert(slots.map((s: any) => ({
        microcycle_id: created.id, slot_type: s.slot_type,
        slot_date: new Date(new Date(s.slot_date).getTime() + diff).toISOString().slice(0, 10),
        session_id: s.session_id, notes: s.notes,
      })));
    }
    toast.success("Microciclo duplicado (+7 días)");
    qc.invalidateQueries({ queryKey: ["microcycles"] });
  }


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Microciclos</h1>
          <p className="text-sm text-muted-foreground">3 entrenamientos + partido (sábado o domingo).</p>
        </div>
        <Button asChild><Link to="/microcycles/new"><Plus className="mr-1 h-4 w-4" /> Nuevo microciclo</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <Card key={m.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <Link to="/microcycles/$id" params={{ id: m.id }} className="font-semibold hover:text-primary">{m.name}</Link>
                <Badge variant="outline" className="capitalize">{m.match_day}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Semana del {formatDate(m.week_start, { day: "numeric", month: "long" })}</p>
              {m.weekly_objective && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.weekly_objective}</p>}
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/microcycles/$id" params={{ id: m.id }}>Abrir</Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(m.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><CalendarRange className="h-6 w-6" /></div>
          <p className="font-medium">Aún no tienes microciclos</p>
          <p className="mt-1 text-sm text-muted-foreground">Planifica tu semana con 3 sesiones y partido. Cada slot tendrá su carga e intención.</p>
          <Button className="mt-4" asChild><Link to="/microcycles/new"><Plus className="mr-1 h-4 w-4" /> Crear microciclo</Link></Button>
        </Card>
      )}
    </div>
  );
}
