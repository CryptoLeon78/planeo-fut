import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BLOCK_TYPES, INTENSITIES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/sessions/new")({
  component: NewSessionPage,
  validateSearch: (search: Record<string, unknown>) => ({
    edit: (search.edit as string) || undefined,
  }),
});

type BlockDraft = {
  block_type: string;
  name: string;
  duration_min: number | "";
  notes: string;
  exercise_ids: string[];
};

const DEFAULT_BLOCKS: BlockDraft[] = [
  { block_type: "calentamiento", name: "Calentamiento", duration_min: 15, notes: "", exercise_ids: [] },
  { block_type: "parte_principal", name: "Parte principal", duration_min: 30, notes: "", exercise_ids: [] },
  { block_type: "juego_aplicacion", name: "Juego de aplicación", duration_min: 20, notes: "", exercise_ids: [] },
  { block_type: "vuelta_calma", name: "Vuelta a la calma", duration_min: 10, notes: "", exercise_ids: [] },
];

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  objective: z.string().trim().max(500).optional(),
  intensity: z.string(),
  session_date: z.string().optional(),
  duration_min: z.coerce.number().int().min(1).max(360).optional().or(z.literal("")),
});

function NewSessionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [blocks, setBlocks] = useState<BlockDraft[]>(DEFAULT_BLOCKS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const { data: editData } = useQuery({
    queryKey: ["session-edit", editId],
    enabled: !!editId && !!user,
    queryFn: async () => {
      if (!editId) return { session: null, blocks: [], items: [] };
      const { data: s } = await supabase.from("sessions").select("*").eq("id", editId).single();
      const { data: blks } = await supabase.from("session_blocks").select("*").eq("session_id", editId).order("position");
      const blockIds = (blks ?? []).map((b: any) => b.id);
      const { data: items } = blockIds.length
        ? await supabase.from("session_block_exercises").select("*").in("block_id", blockIds).order("position")
        : { data: [] };

      if (s && blks) {
        setBlocks(blks.map((b: any) => ({
          block_type: b.block_type,
          name: b.name || "",
          duration_min: b.duration_min || "",
          notes: b.notes || "",
          exercise_ids: (items ?? []).filter((it: any) => it.block_id === b.id).map((it: any) => it.exercise_id),
        })));
      }
      return { session: s, blocks: blks, items };
    },
  });

  const { data: allExercises } = useQuery({
    queryKey: ["exercises", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("id,name,game_phase,intensity,duration_min");
      return data ?? [];
    },
  });

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setBlocks(next);
  }
  function updateBlock(i: number, patch: Partial<BlockDraft>) {
    setBlocks(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function addExerciseToBlock(i: number, exId: string) {
    if (!exId || blocks[i].exercise_ids.includes(exId)) return;
    updateBlock(i, { exercise_ids: [...blocks[i].exercise_ids, exId] });
  }
  function removeExerciseFromBlock(i: number, exId: string) {
    updateBlock(i, { exercise_ids: blocks[i].exercise_ids.filter((x) => x !== exId) });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: any = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message);
    if (!user) return toast.error("Sesión expirada");

    setBusy(true);
    try {
      const { data: sessionId, error } = await (supabase.rpc as any)("save_session_graph", {
        p_session_id: editId ?? null,
        p_name: parsed.data.name,
        p_objective: parsed.data.objective || "",
        p_intensity: (parsed.data.intensity || "media") as "alta" | "baja" | "media" | "muy_alta",
        p_session_date: parsed.data.session_date || null,
        p_duration_min: parsed.data.duration_min === "" ? null : parsed.data.duration_min,
        p_blocks: blocks.map((b, position) => ({
          block_type: b.block_type,
          name: b.name,
          position,
          duration_min: b.duration_min === "" ? null : b.duration_min,
          notes: b.notes,
          exercise_ids: b.exercise_ids,
        })),
      });
      if (error) throw error;
      toast.success(editId ? "Sesión actualizada" : "Sesión creada");
      navigate({ to: "/sessions/$id", params: { id: sessionId! } });
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{editId ? "Editar sesión" : "Nueva sesión"}</h1>
        <p className="text-sm text-muted-foreground">Define los datos básicos y arrastra los bloques para reordenarlos.</p>
      </div>

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" defaultValue={editData?.session?.name ?? ""} required maxLength={120} placeholder="Ej. MD-3 Posesión bajo presión" /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="objective">Objetivo</Label><Textarea id="objective" name="objective" defaultValue={editData?.session?.objective ?? ""} rows={2} /></div>
        <div className="space-y-1.5"><Label htmlFor="session_date">Fecha</Label><Input id="session_date" name="session_date" defaultValue={editData?.session?.session_date ?? ""} type="date" /></div>
        <div className="space-y-1.5"><Label htmlFor="duration_min">Duración total (min)</Label><Input id="duration_min" name="duration_min" defaultValue={editData?.session?.duration_min ?? ""} type="number" min={1} max={360} placeholder="75" /></div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Intensidad</Label>
          <input type="hidden" name="intensity" defaultValue={editData?.session?.intensity || "media"} id="hidden-intensity" />
          <Select defaultValue={editData?.session?.intensity || "media"} onValueChange={(v) => { (document.getElementById("hidden-intensity") as HTMLInputElement).value = v; }}>
            <SelectTrigger className="sm:max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{INTENSITIES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">Bloques de la sesión</h2>
        {blocks.map((b, i) => (
          <Card
            key={i}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) { move(dragIdx, i); setDragIdx(null); } }}
            className="p-4"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
              <Badge variant="secondary">{labelOf(BLOCK_TYPES, b.block_type)}</Badge>
              <Input value={b.name} onChange={(e) => updateBlock(i, { name: e.target.value })} className="max-w-xs" placeholder="Título del bloque" />
              <Input type="number" min={1} value={b.duration_min} onChange={(e) => updateBlock(i, { duration_min: e.target.value === "" ? "" : Number(e.target.value) })} className="w-20" placeholder="min" />
            </div>

            <div className="mt-3 space-y-2">
              {b.exercise_ids.length > 0 && (
                <ul className="space-y-1">
                  {b.exercise_ids.map((exId) => {
                    const ex = allExercises?.find((e: any) => e.id === exId);
                    return (
                      <li key={exId} className="flex items-center justify-between rounded-md border border-border/60 bg-secondary/40 px-2 py-1.5 text-sm">
                        <span>{ex?.name ?? "Ejercicio"}</span>
                        <button type="button" onClick={() => removeExerciseFromBlock(i, exId)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Select onValueChange={(v) => addExerciseToBlock(i, v)} value="">
                <SelectTrigger className="max-w-md"><SelectValue placeholder={allExercises?.length ? "+ Añadir ejercicio" : "Crea ejercicios primero"} /></SelectTrigger>
                <SelectContent>
                  {(allExercises ?? []).filter((e: any) => !b.exercise_ids.includes(e.id)).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea value={b.notes} onChange={(e) => updateBlock(i, { notes: e.target.value })} rows={1} placeholder="Notas del bloque" />
            </div>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={() => setBlocks([...blocks, { block_type: "parte_principal", name: "Nuevo bloque", duration_min: 10, notes: "", exercise_ids: [] }])}>
          <Plus className="mr-1 h-4 w-4" /> Añadir bloque
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => navigate({ to: "/sessions" })}>Cancelar</Button>
        <Button type="submit" disabled={busy}>{editId ? "Guardar cambios" : "Crear sesión"}</Button>
      </div>
    </form>
  );
}
