import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { startOfWeek, addDays, ymd, MICROCYCLE_SLOT_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/microcycles/new")({
  component: NewMicrocyclePage,
});

function NewMicrocyclePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const today = startOfWeek(new Date());
  const [weekStart, setWeekStart] = useState(ymd(today));
  const [matchDay, setMatchDay] = useState<"sabado" | "domingo">("sabado");
  const [name, setName] = useState(`Microciclo ${today.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`);
  const [objective, setObjective] = useState("");

  async function onCreate() {
    if (!user) return;
    setBusy(true);
    try {
      const { data: micro, error } = await (supabase.from("microcycles") as any).insert({
        owner_id: user.id, name, week_start: weekStart, match_day: matchDay,
        weekly_objective: objective || null,
      }).select("id").single();
      if (error) throw error;

      // Generate slots: MD-4 (Mon), MD-3 (Tue), MD-2 (Wed/Thu depending), MD-1 (Fri), MD (Sat/Sun)
      const base = new Date(weekStart);
      const matchOffset = matchDay === "sabado" ? 5 : 6;
      const slotDefs = matchDay === "sabado"
        ? [["MD-4", 1], ["MD-3", 2], ["MD-2", 3], ["MD-1", 4], ["MD", 5]] as const
        : [["MD-4", 1], ["MD-3", 2], ["MD-2", 3], ["MD-1", 5], ["MD", 6]] as const;
      void matchOffset;

      const slots = slotDefs.map(([type, offset]) => ({
        microcycle_id: micro.id,
        slot_type: type,
        slot_date: ymd(addDays(base, offset)),
        session_id: null,
        notes: null,
      }));
      const { error: e2 } = await (supabase.from("microcycle_slots") as any).insert(slots);
      if (e2) throw e2;

      toast.success("Microciclo creado");
      navigate({ to: "/microcycles/$id", params: { id: micro.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo microciclo</h1>
        <p className="text-sm text-muted-foreground">Generaremos automáticamente los slots MD-4, MD-3, MD-2, MD-1 y MD.</p>
      </div>

      <Card className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ws">Semana (lunes)</Label>
            <Input id="ws" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Día de partido</Label>
            <Select value={matchDay} onValueChange={(v) => setMatchDay(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sabado">Sábado</SelectItem>
                <SelectItem value="domingo">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="obj">Objetivo semanal</Label>
          <Textarea id="obj" value={objective} onChange={(e) => setObjective(e.target.value)} rows={3}
            placeholder="Ej. Mejorar la salida de balón contra presión alta" />
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Estructura prevista</p>
          <ul className="space-y-1 text-sm">
            {MICROCYCLE_SLOT_TYPES.map((s) => (
              <li key={s.value} className="flex justify-between">
                <span>{s.label}</span>
                <span className="text-muted-foreground">{s.intensity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onCreate} disabled={busy}>Crear microciclo</Button>
        </div>
      </Card>
    </div>
  );
}
