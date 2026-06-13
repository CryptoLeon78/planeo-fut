import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const INTENSITY_COLORS: Record<string, string> = {
  baja: "hsl(145 60% 55%)",
  media: "hsl(45 90% 55%)",
  alta: "hsl(15 80% 60%)",
};

function AnalyticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: evals } = await supabase
        .from("session_evaluations")
        .select("rating,intensity_perceived,objectives_met,evaluated_at,session_id,sessions(name,session_date)")
        .order("evaluated_at", { ascending: true })
        .limit(200);
      return evals ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const evals = data ?? [];
  const total = evals.length;
  const avgRating = total ? (evals.reduce((a, e: any) => a + (e.rating ?? 0), 0) / total).toFixed(1) : "—";
  const metPct = total ? Math.round((evals.filter((e: any) => e.objectives_met).length / total) * 100) : 0;

  // Timeline: rating per evaluation
  const timeline = evals.map((e: any, idx: number) => ({
    idx: idx + 1,
    fecha: new Date(e.evaluated_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    rating: e.rating ?? 0,
  }));

  // Intensity distribution
  const intensityCounts = evals.reduce((acc: Record<string, number>, e: any) => {
    const k = e.intensity_perceived ?? "sin dato";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const intensityData = Object.entries(intensityCounts).map(([name, value]) => ({ name, value }));

  // Objectives met (last 8)
  const lastEight = evals.slice(-8).map((e: any, i: number) => ({
    name: `#${i + 1}`,
    cumplido: e.objectives_met ? 1 : 0,
    no: e.objectives_met ? 0 : 1,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Evolución de tus evaluaciones de sesión.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Evaluaciones" value={String(total)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Rating medio" value={avgRating} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Objetivos cumplidos" value={`${metPct}%`} />
      </div>

      {total === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <p className="font-medium">Aún no hay evaluaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">Evalúa tus sesiones desde el detalle de cada sesión para ver tu evolución aquí.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Rating por sesión</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="rating" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Distribución de intensidad percibida</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={intensityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {intensityData.map((d, i) => (
                      <Cell key={i} fill={INTENSITY_COLORS[d.name] ?? "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-3 font-semibold">Últimas 8 sesiones · objetivos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lastEight}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="cumplido" stackId="a" fill="hsl(145 60% 55%)" />
                  <Bar dataKey="no" stackId="a" fill="hsl(15 80% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">{icon} {label}</div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}
