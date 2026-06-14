import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy, Zap, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { addDays, formatDate, labelOf, SEASON_EVENT_TYPES, startOfWeek, ymd } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), offset * 7), [offset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekStartStr = ymd(weekStart);
  const weekEndStr = ymd(addDays(weekStart, 7));

  const { data: sessions } = useQuery({
    queryKey: ["calendar-sessions", user?.id, weekStartStr],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sessions")
        .select("id,name,session_date,intensity,duration_min")
        .gte("session_date", weekStartStr).lt("session_date", weekEndStr);
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["calendar-events", user?.id, weekStartStr],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("season_events").select("*")
        .gte("event_date", weekStartStr).lt("event_date", weekEndStr)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: slots } = useQuery({
    queryKey: ["calendar-slots", user?.id, weekStartStr],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("microcycle_slots")
        .select("id,slot_type,slot_date,session_id,microcycle_id,microcycles!inner(owner_id,name)")
        .gte("slot_date", weekStartStr).lt("slot_date", weekEndStr);
      return data ?? [];
    },
  });

  const intensityColors: Record<string, string> = {
    baja: "bg-blue-100 text-blue-800 border-blue-200",
    media: "bg-yellow-100 text-yellow-800 border-yellow-200",
    alta: "bg-orange-100 text-orange-800 border-orange-200",
    muy_alta: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario semanal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semana del {weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "long" })} al {addDays(weekStart, 6).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Hoy</Button>
          <Button variant="outline" size="icon" onClick={() => setOffset((o) => o + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((d) => {
          const key = ymd(d);
          const daySessions = (sessions ?? []).filter((s: any) => s.session_date === key);
          const dayEvents = (events ?? []).filter((e: any) => e.event_date === key);
          const daySlots = (slots ?? []).filter((s: any) => s.slot_date === key);
          const isToday = key === ymd(new Date());
          const hasMatch = dayEvents.some((e: any) => e.type === "partido_oficial" || e.type === "amistoso");
          const totalDuration = daySessions.reduce((sum: number, s: any) => sum + (s.duration_min || 0), 0);

          return (
            <Card
              key={key}
              className={`overflow-hidden transition-all ${
                isToday ? "border-2 border-primary shadow-lg" : "border border-border"
              } ${hasMatch ? "bg-gradient-to-br from-primary/5 to-primary/10" : "bg-card"}`}
            >
              <div className={`px-3 py-2 ${isToday ? "bg-primary/10" : "bg-muted/50"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {d.toLocaleDateString("es-ES", { weekday: "short" })}
                  </span>
                  <span className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</span>
                </div>
              </div>

              <div className="min-h-[200px] space-y-2 p-3">
                {/* Eventos (Partidos, etc) */}
                {dayEvents.map((e: any) => (
                  <div key={e.id} className="rounded-md border-l-4 border-primary bg-primary/10 px-2 py-2">
                    <div className="flex items-start gap-2">
                      <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-semibold text-primary">{e.title}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">{labelOf(SEASON_EVENT_TYPES, e.type)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Sesiones */}
                {daySessions.map((s: any) => (
                  <Link
                    key={s.id}
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className={`block rounded-md border border-border/60 px-2 py-2 transition-all hover:border-primary hover:shadow-sm ${
                      intensityColors[s.intensity] || "bg-accent"
                    }`}
                  >
                    <p className="line-clamp-1 text-xs font-medium">{s.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span className="text-[10px]">{s.duration_min || 0}′</span>
                    </div>
                  </Link>
                ))}

                {/* Slots sin sesión */}
                {daySlots.filter((s: any) => !s.session_id).map((s: any) => (
                  <Link
                    key={s.id}
                    to="/microcycles/$id"
                    params={{ id: s.microcycle_id }}
                    className="block rounded-md border border-dashed border-border/60 px-2 py-2 text-xs text-muted-foreground hover:border-primary hover:bg-muted/50"
                  >
                    <p className="line-clamp-1 font-medium">{s.slot_type}</p>
                    <p className="text-[10px]">sin sesión</p>
                  </Link>
                ))}

                {/* Día libre */}
                {daySessions.length === 0 && dayEvents.length === 0 && daySlots.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground/50">
                      <CalendarIcon className="h-5 w-5" />
                      <span>Libre</span>
                    </p>
                  </div>
                )}

                {/* Resumen del día */}
                {(daySessions.length > 0 || dayEvents.length > 0) && (
                  <div className="border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>{daySessions.length} sesión{daySessions.length !== 1 ? "es" : ""}</span>
                      <span className="font-medium">{totalDuration}′</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Leyenda */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Intensidad de sesiones</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(intensityColors).map(([intensity, colors]) => (
            <div key={intensity} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded ${colors}`} />
              <span className="text-xs capitalize text-muted-foreground">{intensity}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
