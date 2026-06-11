import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy } from "lucide-react";
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
        .select("id,name,session_date,intensity")
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario semanal</h1>
          <p className="text-sm text-muted-foreground">
            {weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
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
          return (
            <Card key={key} className={`min-h-[160px] p-3 ${isToday ? "border-primary/60 shadow-glow" : ""} ${hasMatch ? "bg-primary/5" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-muted-foreground">{d.toLocaleDateString("es-ES", { weekday: "short" })}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((e: any) => (
                  <div key={e.id} className="rounded-md bg-primary/20 px-2 py-1 text-xs">
                    <div className="flex items-center gap-1 font-medium"><Trophy className="h-3 w-3" />{e.title}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{labelOf(SEASON_EVENT_TYPES, e.type)}</Badge>
                  </div>
                ))}
                {daySessions.map((s: any) => (
                  <Link key={s.id} to="/sessions/$id" params={{ id: s.id }}
                    className="block rounded-md bg-accent px-2 py-1 text-xs hover:bg-accent/70">
                    <p className="line-clamp-1 font-medium">{s.name}</p>
                    {s.intensity && <Badge variant="outline" className="mt-1 text-[10px]">{s.intensity}</Badge>}
                  </Link>
                ))}
                {daySlots.filter((s: any) => !s.session_id).map((s: any) => (
                  <Link key={s.id} to="/microcycles/$id" params={{ id: s.microcycle_id }}
                    className="block rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary">
                    {s.slot_type} · sin sesión
                  </Link>
                ))}
                {daySessions.length === 0 && dayEvents.length === 0 && daySlots.length === 0 && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground/40"><CalendarIcon className="h-3 w-3" /> libre</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
