import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, SEASON_EVENT_TYPES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/season/$id")({
  component: SeasonDetail,
});

function SeasonDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [evt, setEvt] = useState({
    event_date: new Date().toISOString().slice(0, 10),
    type: "partido_oficial",
    title: "",
    opponent: "",
    location: "",
    notes: "",
  });

  const { data: meso } = useQuery({
    queryKey: ["mesocycle", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("mesocycles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["season-events", id, meso?.start_date, meso?.end_date],
    enabled: !!meso,
    queryFn: async () => {
      const { data } = await supabase.from("season_events").select("*")
        .gte("event_date", meso!.start_date).lte("event_date", meso!.end_date)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: micros } = useQuery({
    queryKey: ["season-micros", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("microcycles").select("id,name,week_start,match_day,weekly_objective")
        .or(`mesocycle_id.eq.${id},week_start.gte.${meso?.start_date ?? "1970-01-01"}`)
        .order("week_start", { ascending: true });
      return (data ?? []).filter((m: any) =>
        m.week_start >= (meso?.start_date ?? "1970-01-01") && m.week_start <= (meso?.end_date ?? "2999-12-31")
      );
    },
    enabled: !!meso,
  });

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    (micros ?? []).forEach((m: any) => {
      const key = new Date(m.week_start).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      (g[key] ||= []).push(m);
    });
    return g;
  }, [micros]);

  async function saveField(field: string, value: string) {
    const { error } = await (supabase.from("mesocycles") as any).update({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
  }

  async function addEvent() {
    if (!user || !evt.title.trim()) return toast.error("Falta título");
    const { error } = await (supabase.from("season_events") as any).insert({
      owner_id: user.id,
      event_date: evt.event_date,
      type: evt.type,
      title: evt.title,
      opponent: evt.opponent || null,
      location: evt.location || null,
      notes: evt.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Evento añadido");
    setOpen(false);
    setEvt({ ...evt, title: "", opponent: "", location: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["season-events"] });
  }

  async function deleteEvent(eid: string) {
    await supabase.from("season_events").delete().eq("id", eid);
    qc.invalidateQueries({ queryKey: ["season-events"] });
  }

  if (!meso) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/season"><ArrowLeft className="h-4 w-4" /></Link></Button>
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Calendario de partidos y eventos</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Nuevo evento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo evento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fecha</Label>
                    <Input type="date" value={evt.event_date} onChange={(e) => setEvt({ ...evt, event_date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={evt.type} onValueChange={(v) => setEvt({ ...evt, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEASON_EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input value={evt.title} onChange={(e) => setEvt({ ...evt, title: e.target.value })}
                    placeholder="Jornada 1 / Test físico / etc." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Rival</Label>
                    <Input value={evt.opponent} onChange={(e) => setEvt({ ...evt, opponent: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lugar</Label>
                    <Input value={evt.location} onChange={(e) => setEvt({ ...evt, location: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea rows={2} value={evt.notes} onChange={(e) => setEvt({ ...evt, notes: e.target.value })} />
                </div>
                <Button onClick={addEvent} className="w-full">Añadir</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary">
                    <div className="text-[10px] uppercase">{new Date(e.event_date).toLocaleDateString("es-ES", { month: "short" })}</div>
                    <div className="text-sm font-bold leading-none">{new Date(e.event_date).getDate()}</div>
                  </div>
                  <div>
                    <p className="font-medium">{e.title}{e.opponent && <span className="text-muted-foreground"> · vs {e.opponent}</span>}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{labelOf(SEASON_EVENT_TYPES, e.type)}</Badge>
                      {e.location && <span className="text-xs text-muted-foreground">{e.location}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteEvent(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no hay eventos. Añade partidos, amistosos y tests.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Microciclos por mes</h2>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-muted-foreground">Crea microciclos dentro del rango de la temporada para verlos agrupados aquí.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([month, list]) => (
              <div key={month}>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{month}</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {list.map((m: any) => (
                    <Link key={m.id} to="/microcycles/$id" params={{ id: m.id }}
                      className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-primary">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">Semana del {formatDate(m.week_start, { day: "numeric", month: "long" })} · partido {m.match_day}</p>
                      </div>
                      <span className="text-xs text-primary">Abrir →</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
