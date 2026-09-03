import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/preseason/$id")({
  component: PreseasonDetail,
});

function PreseasonDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: meso } = useQuery({
    queryKey: ["mesocycle", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mesocycles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: micros } = useQuery({
    queryKey: ["mesocycle-micros", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("microcycles").select("id,name,week_start,weekly_objective")
        .eq("mesocycle_id", id).order("week_start", { ascending: true });
      return data ?? [];
    },
  });

  async function updatePhase(idx: number, field: string, value: string) {
    if (!meso) return;
    const phases = [...((meso.phases as any[]) ?? [])];
    phases[idx] = { ...phases[idx], [field]: field === "weeks" ? Number(value) : value };
    const { error } = await (supabase.from("mesocycles") as any).update({ phases }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["mesocycle", id] });
  }

  async function saveField(field: string, value: string) {
    const { error } = await (supabase.from("mesocycles") as any).update({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
  }

  if (!meso) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  const phases = (meso.phases as any[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Volver a pretemporada"><Link to="/preseason"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meso.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(meso.start_date)} → {formatDate(meso.end_date)}</p>
        </div>
      </div>

      <Card className="space-y-3 p-5">
        <div className="space-y-1.5">
          <Label>Objetivos</Label>
          <Textarea defaultValue={meso.goals ?? ""} rows={3} onBlur={(e) => saveField("goals", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea defaultValue={meso.notes ?? ""} rows={2} onBlur={(e) => saveField("notes", e.target.value)} />
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Fases</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {phases.map((p, i) => (
            <Card key={p.key ?? i} className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase text-primary">{p.label}</p>
              <div className="space-y-1">
                <Label className="text-xs">Semanas</Label>
                <Input type="number" min={1} defaultValue={p.weeks ?? 1}
                  onBlur={(e) => updatePhase(i, "weeks", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Foco principal</Label>
                <Textarea rows={3} defaultValue={p.focus ?? ""}
                  onBlur={(e) => updatePhase(i, "focus", e.target.value)} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Microciclos asociados</h2>
        {micros && micros.length > 0 ? (
          <div className="grid gap-2">
            {micros.map((m: any) => (
              <Link key={m.id} to="/microcycles/$id" params={{ id: m.id }}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-primary">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">Semana del {formatDate(m.week_start, { day: "numeric", month: "long" })}</p>
                </div>
                <span className="text-xs text-primary">Abrir →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay microciclos asociados aún. Crea uno desde la sección Microciclos.</p>
        )}
      </div>
    </div>
  );
}
