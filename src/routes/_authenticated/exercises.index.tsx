import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Filter, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExerciseForm } from "@/components/exercise-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GAME_PHASES, INTENSITIES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/exercises/")({
  component: ExercisesPage,
});

function ExercisesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<string>("all");
  const [intensity, setIntensity] = useState<string>("all");
  const [onlyFav, setOnlyFav] = useState(false);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (exercises ?? []).filter((e: any) => {
      if (onlyFav && !e.is_favorite) return false;
      if (phase !== "all" && e.game_phase !== phase) return false;
      if (intensity !== "all" && e.intensity !== intensity) return false;
      if (q && !`${e.name} ${e.objective ?? ""} ${(e.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [exercises, q, phase, intensity, onlyFav]);

  async function toggleFav(id: string, current: boolean) {
    const { error } = await (supabase.from("exercises") as any).update({ is_favorite: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["exercises"] });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de ejercicios</h1>
          <p className="text-sm text-muted-foreground">Crea, filtra y reutiliza ejercicios con ficha completa.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Nuevo ejercicio</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Nuevo ejercicio</DialogTitle></DialogHeader>
            <ExerciseForm onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["exercises"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, objetivo o etiqueta…" className="pl-9" />
          </div>
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger><SelectValue placeholder="Fase del juego" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fases</SelectItem>
              {GAME_PHASES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={intensity} onValueChange={setIntensity}>
            <SelectTrigger><SelectValue placeholder="Intensidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier intensidad</SelectItem>
              {INTENSITIES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={onlyFav ? "default" : "outline"} onClick={() => setOnlyFav((v) => !v)}>
            <Star className={`mr-1 h-4 w-4 ${onlyFav ? "fill-current" : ""}`} /> Favoritos
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="font-medium">{exercises?.length === 0 ? "Aún no tienes ejercicios" : "No hay coincidencias con los filtros"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercises?.length === 0 ? "Crea tu primer ejercicio para empezar tu biblioteca." : "Prueba a ajustar la búsqueda o quitar filtros."}
          </p>
          {exercises?.length === 0 && (
            <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Crear ejercicio</Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e: any) => (
            <Card key={e.id} className="group flex flex-col p-4 transition hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <Link to="/exercises/$id" params={{ id: e.id }} className="font-semibold leading-tight group-hover:text-primary">
                  {e.name}
                </Link>
                <button onClick={() => toggleFav(e.id, e.is_favorite)} aria-label="Favorito">
                  <Star className={`h-4 w-4 ${e.is_favorite ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              </div>
              {e.objective && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.objective}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{labelOf(GAME_PHASES, e.game_phase)}</Badge>
                <Badge variant="outline">{labelOf(INTENSITIES, e.intensity)}</Badge>
                {e.duration_min && <Badge variant="outline">{e.duration_min}′</Badge>}
                {e.players_count != null && <Badge variant="outline">{e.players_count} jug.</Badge>}
              </div>
              {e.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.tags.slice(0, 4).map((t: string) => <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
