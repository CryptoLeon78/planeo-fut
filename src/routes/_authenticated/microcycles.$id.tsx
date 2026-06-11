import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, MICROCYCLE_SLOT_TYPES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/microcycles/$id")({
  component: MicroDetailPage,
});

function MicroDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: micro } = useQuery({
    queryKey: ["microcycle", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("microcycles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: slots } = useQuery({
    queryKey: ["microcycle-slots", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("microcycle_slots")
        .select("id,slot_type,slot_date,notes,session_id")
        .eq("microcycle_id", id)
        .order("slot_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions-min"],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("id,name").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [name, setName] = useState<string | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  async function saveMeta() {
    const payload: any = {};
    if (name !== null) payload.name = name;
    if (objective !== null) payload.weekly_objective = objective;
    if (notes !== null) payload.notes = notes;
    if (Object.keys(payload).length === 0) return;
    const { error } = await (supabase.from("microcycles") as any).update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    qc.invalidateQueries({ queryKey: ["microcycle", id] });
  }

  async function updateSlot(slotId: string, payload: any) {
    const { error } = await (supabase.from("microcycle_slots") as any).update(payload).eq("id", slotId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["microcycle-slots", id] });
  }

  async function remove() {
    if (!confirm("¿Eliminar microciclo?")) return;
    await supabase.from("microcycles").delete().eq("id", id);
    toast.success("Eliminado");
    navigate({ to: "/microcycles" });
  }

  if (!micro) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link to="/microcycles"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{micro.name}</h1>
            <p className="text-sm text-muted-foreground">
              Semana del {formatDate(micro.week_start, { day: "numeric", month: "long", year: "numeric" })} ·
              Partido {micro.match_day}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input defaultValue={micro.name} onChange={(e) => setName(e.target.value)} onBlur={saveMeta} />
          </div>
          <div className="space-y-1.5">
            <Label>Día de partido</Label>
            <Select defaultValue={micro.match_day} onValueChange={async (v) => {
              await (supabase.from("microcycles") as any).update({ match_day: v }).eq("id", id);
              qc.invalidateQueries({ queryKey: ["microcycle", id] });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sabado">Sábado</SelectItem>
                <SelectItem value="domingo">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Objetivo semanal</Label>
          <Textarea defaultValue={micro.weekly_objective ?? ""} rows={2}
            onChange={(e) => setObjective(e.target.value)} onBlur={saveMeta} />
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea defaultValue={micro.notes ?? ""} rows={2}
            onChange={(e) => setNotes(e.target.value)} onBlur={saveMeta} />
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Planificación semanal</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {(slots ?? []).map((s: any) => {
            const meta = MICROCYCLE_SLOT_TYPES.find((x) => x.value === s.slot_type);
            const isMatch = s.slot_type === "MD";
            return (
              <Card key={s.id} className={`flex flex-col gap-2 p-4 ${isMatch ? "border-primary/60 bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between">
                  <Badge variant={isMatch ? "default" : "outline"}>{s.slot_type}</Badge>
                  <span className="text-[10px] uppercase text-muted-foreground">{meta?.intensity}</span>
                </div>
                <p className="text-xs font-medium">{formatDate(s.slot_date, { weekday: "long", day: "numeric" })}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{meta?.label}</p>

                {!isMatch ? (
                  <Select
                    value={s.session_id ?? "none"}
                    onValueChange={(v) => updateSlot(s.id, { session_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sin sesión" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— sin sesión —</SelectItem>
                      {(sessions ?? []).map((x: any) => (
                        <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs font-medium text-primary">Día de partido</p>
                )}

                {s.session_id && (
                  <Link to="/sessions/$id" params={{ id: s.session_id }} className="text-[11px] text-primary hover:underline">
                    Abrir sesión →
                  </Link>
                )}

                <Textarea
                  defaultValue={s.notes ?? ""} rows={2} placeholder="Notas / intención"
                  className="text-xs"
                  onBlur={(e) => {
                    if (e.target.value !== (s.notes ?? "")) updateSlot(s.id, { notes: e.target.value || null });
                  }}
                />
              </Card>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Leyenda · {MICROCYCLE_SLOT_TYPES.map((s) => labelOf(MICROCYCLE_SLOT_TYPES, s.value)).join(" · ")}
      </div>
    </div>
  );
}
