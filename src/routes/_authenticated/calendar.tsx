import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
}

function CalendarPage() {
  const { user } = useAuth();
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  const { data: sessions } = useQuery({
    queryKey: ["calendar-sessions", user?.id, weekStart.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const end = new Date(weekStart); end.setDate(end.getDate() + 7);
      const { data } = await supabase
        .from("sessions").select("id,name,session_date,intensity")
        .gte("session_date", weekStart.toISOString().slice(0, 10))
        .lt("session_date", end.toISOString().slice(0, 10));
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendario semanal</h1>
        <p className="text-sm text-muted-foreground">{weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const day = (sessions ?? []).filter((s: any) => s.session_date === key);
          const isToday = key === new Date().toISOString().slice(0, 10);
          return (
            <Card key={key} className={`min-h-[140px] p-3 ${isToday ? "border-primary/60 shadow-glow" : ""}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-muted-foreground">{d.toLocaleDateString("es-ES", { weekday: "short" })}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
              </div>
              <div className="space-y-1.5">
                {day.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">—</p>
                ) : day.map((s: any) => (
                  <Link key={s.id} to="/sessions/$id" params={{ id: s.id }} className="block rounded-md bg-primary/15 px-2 py-1 text-xs hover:bg-primary/25">
                    <p className="line-clamp-1 font-medium">{s.name}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{s.intensity}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
