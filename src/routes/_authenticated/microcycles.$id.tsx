import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Trash2, Sparkles, GripVertical, X, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { exportToPdf } from "@/lib/i18n";
import { formatDate, MICROCYCLE_SLOT_TYPES } from "@/lib/constants";
import { suggestMicrocycle, type MicrocycleSuggestion } from "@/lib/microcycle-ai.functions";

export const Route = createFileRoute("/_authenticated/microcycles/$id")({
  component: MicroDetailPage,
});

function MicroDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [draggingSession, setDraggingSession] = useState<any>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCtx, setAiCtx] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<MicrocycleSuggestion | null>(null);

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
      const { data } = await supabase.from("microcycle_slots")
        .select("id,slot_type,slot_date,notes,session_id")
        .eq("microcycle_id", id).order("slot_date");
      return data ?? [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions-min"],
    queryFn: async () => {
      const { data } = await supabase.from("sessions").select("id,name,intensity,duration_min")
        .order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  async function saveMeta(payload: any) {
    const { error } = await (supabase.from("microcycles") as any).update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["microcycle", id] });
  }

  async function updateSlot(slotId: string, payload: any) {
    const { error } = await (supabase.from("microcycle_slots") as any).update(payload).eq("id", slotId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["microcycle-slots", id] });
  }

  async function assignSession(slotId: string, sessionId: string) {
    // detect conflicts: same session already assigned in another slot
    const conflict = (slots ?? []).find((s: any) => s.session_id === sessionId && s.id !== slotId);
    const targetSlot = (slots ?? []).find((s: any) => s.id === slotId);
    if (targetSlot?.slot_type === "MD") return toast.error("MD es día de partido, no se asignan sesiones");
    if (conflict) {
      await (supabase.from("microcycle_slots") as any).update({ session_id: null }).eq("id", conflict.id);
      toast.info(`Sesión movida desde ${conflict.slot_type} → ${targetSlot?.slot_type}`);
    }
    await updateSlot(slotId, { session_id: sessionId });
    toast.success("Sesión asignada");
  }

  function onDragStart(e: DragStartEvent) {
    const s = (sessions ?? []).find((x: any) => x.id === e.active.id);
    setDraggingSession(s);
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingSession(null);
    if (!e.over) return;
    const slotId = String(e.over.id);
    const sessionId = String(e.active.id);
    assignSession(slotId, sessionId);
  }

  async function remove() {
    if (!confirm("¿Eliminar microciclo?")) return;
    await supabase.from("microcycles").delete().eq("id", id);
    toast.success("Eliminado");
    navigate({ to: "/microcycles" });
  }

  async function generateAi() {
    if (!micro) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await suggestMicrocycle({
        data: {
          weekStart: micro.week_start,
          matchDay: micro.match_day as any,
          mesocycleId: (micro as any).mesocycle_id ?? null,
          context: aiCtx || null,
        },
      });
      setAiResult(res);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("429")) toast.error("Límite de IA alcanzado. Intenta en un momento.");
      else if (msg.includes("402")) toast.error("Créditos de IA agotados. Añade créditos en tu workspace.");
      else toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  }

  async function applyAiSuggestion() {
    if (!aiResult || !slots) return;
    // Update slot notes & focus, leave session assignment to the user
    for (const sug of aiResult.slots) {
      const slot = slots.find((s: any) => s.slot_type === sug.slot_type);
      if (!slot) continue;
      const noteLines = [
        `Foco: ${sug.focus}`,
        `Intensidad: ${sug.intensity}`,
        sug.notes,
        sug.recommended_exercise_ids.length
          ? `Ejercicios sugeridos: ${sug.recommended_exercise_ids.join(", ")}`
          : "",
      ].filter(Boolean).join("\n");
      await (supabase.from("microcycle_slots") as any).update({ notes: noteLines }).eq("id", slot.id);
    }
    if (aiResult.weekly_objective) {
      await saveMeta({ weekly_objective: aiResult.weekly_objective });
    }
    qc.invalidateQueries({ queryKey: ["microcycle-slots", id] });
    toast.success("Sugerencia aplicada al microciclo");
    setAiOpen(false);
    setAiResult(null);
  }

  if (!micro) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="mx-auto max-w-7xl space-y-6 print-area">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon"><Link to="/microcycles"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{micro.name}</h1>
              <p className="text-sm text-muted-foreground">
                Semana del {formatDate(micro.week_start, { day: "numeric", month: "long", year: "numeric" })} · partido {micro.match_day}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToPdf(micro.name)}><FileDown className="mr-1 h-4 w-4" /> PDF</Button>
            <Button variant="outline" onClick={() => setAiOpen(true)}>
              <Sparkles className="mr-1 h-4 w-4" /> Generar con IA
            </Button>
            <Button variant="ghost" size="icon" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="hidden print:block">
          <h1 className="text-2xl font-bold">{micro.name}</h1>
          <p className="text-sm">Semana del {formatDate(micro.week_start, { day: "numeric", month: "long", year: "numeric" })} · partido {micro.match_day}</p>
          {micro.weekly_objective && <p className="mt-2 text-sm">Objetivo: {micro.weekly_objective}</p>}
        </div>


        <Card className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input defaultValue={micro.name} onBlur={(e) => e.target.value !== micro.name && saveMeta({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Día de partido</Label>
              <Select defaultValue={micro.match_day} onValueChange={(v) => saveMeta({ match_day: v })}>
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
              onBlur={(e) => saveMeta({ weekly_objective: e.target.value || null })} />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Planificación semanal</h2>
            <div className="grid gap-3 md:grid-cols-5">
              {(slots ?? []).map((s: any) => (
                <SlotCard key={s.id} slot={s} sessions={sessions ?? []}
                  onAssign={(sid: string) => assignSession(s.id, sid)}
                  onClear={() => updateSlot(s.id, { session_id: null })}
                  onNotes={(notes: string | null) => updateSlot(s.id, { notes })} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Arrastra una sesión del panel derecho sobre un slot, o usa el selector. Las colisiones se resuelven moviendo la sesión.
            </p>
          </div>

          <aside className="space-y-2">
            <h3 className="text-sm font-semibold">Sesiones disponibles</h3>
            <div className="space-y-2">
              {(sessions ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No tienes sesiones aún. <Link to="/sessions/new" className="text-primary hover:underline">Crear sesión</Link></p>
              )}
              {(sessions ?? []).map((sess: any) => <DraggableSession key={sess.id} session={sess} />)}
            </div>
          </aside>
        </div>
      </div>

      <DragOverlay>
        {draggingSession && (
          <div className="rounded-md border border-primary bg-card px-3 py-2 text-sm shadow-lg">
            {draggingSession.name}
          </div>
        )}
      </DragOverlay>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Asistente IA · microciclo</DialogTitle></DialogHeader>
          {!aiResult ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Analizo tus objetivos de mesociclo y tu biblioteca de ejercicios para proponer un microciclo MD-4 → MD adaptado a esta semana.
              </p>
              <div className="space-y-1.5">
                <Label>Contexto adicional (opcional)</Label>
                <Textarea rows={3} placeholder="Ej. Venimos de derrota, necesito reforzar salida de balón y confianza."
                  value={aiCtx} onChange={(e) => setAiCtx(e.target.value)} />
              </div>
              <Button onClick={generateAi} disabled={aiLoading} className="w-full">
                {aiLoading ? "Pensando…" : <><Sparkles className="mr-1 h-4 w-4" /> Generar propuesta</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md bg-secondary/40 p-3 text-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">Objetivo semanal sugerido</p>
                <p className="mt-1">{aiResult.weekly_objective}</p>
              </div>
              <div className="max-h-[40vh] space-y-2 overflow-y-auto">
                {aiResult.slots.map((s) => (
                  <div key={s.slot_type} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Badge>{s.slot_type}</Badge>
                      <span className="text-xs text-muted-foreground">{s.intensity}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{s.focus}</p>
                    <p className="text-xs text-muted-foreground">{s.notes}</p>
                    {s.recommended_exercise_ids.length > 0 && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Ejercicios: {s.recommended_exercise_ids.map((eid) => {
                          const e = (sessions ?? []).find(() => false); void e;
                          return eid.slice(0, 6);
                        }).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAiResult(null)} className="flex-1">Descartar</Button>
                <Button onClick={applyAiSuggestion} className="flex-1">Aplicar al microciclo</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}

function DraggableSession({ session }: { session: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: session.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`flex cursor-grab items-center gap-2 rounded-md border border-border bg-card p-2 text-xs hover:border-primary active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}>
      <GripVertical className="h-3 w-3 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{session.name}</p>
        {session.duration_min && <p className="text-[10px] text-muted-foreground">{session.duration_min}′</p>}
      </div>
    </div>
  );
}

function SlotCard({ slot, sessions, onAssign, onClear, onNotes }: any) {
  const meta = MICROCYCLE_SLOT_TYPES.find((x) => x.value === slot.slot_type);
  const isMatch = slot.slot_type === "MD";
  const { setNodeRef, isOver } = useDroppable({ id: slot.id, disabled: isMatch });
  const assigned = sessions.find((s: any) => s.id === slot.session_id);
  return (
    <Card ref={setNodeRef}
      className={`flex flex-col gap-2 p-4 transition-colors ${isMatch ? "border-primary/60 bg-primary/5" : ""} ${isOver ? "border-primary ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-center justify-between">
        <Badge variant={isMatch ? "default" : "outline"}>{slot.slot_type}</Badge>
        <span className="text-[10px] uppercase text-muted-foreground">{meta?.intensity}</span>
      </div>
      <p className="text-xs font-medium">{formatDate(slot.slot_date, { weekday: "long", day: "numeric" })}</p>
      <p className="text-[11px] text-muted-foreground line-clamp-2">{meta?.label}</p>

      {isMatch ? (
        <p className="text-xs font-medium text-primary">Día de partido</p>
      ) : (
        <>
          {assigned ? (
            <div className="flex items-center justify-between gap-1 rounded-md bg-accent px-2 py-1 text-xs">
              <Link to="/sessions/$id" params={{ id: assigned.id }} className="line-clamp-1 font-medium hover:underline">
                {assigned.name}
              </Link>
              <button onClick={onClear} className="text-muted-foreground hover:text-destructive" aria-label="Quitar"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <Select value="none" onValueChange={(v) => v !== "none" && onAssign(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Asignar o arrastra" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— sin sesión —</SelectItem>
                {sessions.map((x: any) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </>
      )}

      <Textarea defaultValue={slot.notes ?? ""} rows={2} placeholder="Notas / intención" className="text-xs"
        onBlur={(e) => { if (e.target.value !== (slot.notes ?? "")) onNotes(e.target.value || null); }} />
    </Card>
  );
}
