import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const AnalyticsCharts = lazy(() => import("@/components/analytics-charts"));

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics de sesiones · PlaneoFUT" },
      { name: "description", content: "Evolución del rating, la intensidad percibida y el cumplimiento de objetivos de tus sesiones." },
      { property: "og:title", content: "Analytics de sesiones · PlaneoFUT" },
      { property: "og:description", content: "Evolución del rating, la intensidad percibida y el cumplimiento de objetivos de tus sesiones." },
    ],
  }),
  component: AnalyticsPage,
});

type EvaluationRow = {
  rating: number | null;
  intensity_perceived: string | null;
  objectives_met: boolean | null;
  evaluated_at: string;
};

function AnalyticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<EvaluationRow[]> => {
      const { data: evals } = await supabase
        .from("session_evaluations")
        .select("rating,intensity_perceived,objectives_met,evaluated_at")
        .order("evaluated_at", { ascending: true })
        .limit(200);
      return (evals ?? []) as EvaluationRow[];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const evals = data ?? [];
  const total = evals.length;
  const avgRating = total ? (evals.reduce((a, e) => a + (e.rating ?? 0), 0) / total).toFixed(1) : "—";
  const metPct = total ? Math.round((evals.filter((e) => e.objectives_met).length / total) * 100) : 0;

  const timeline = evals.map((e) => ({
    fecha: new Date(e.evaluated_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    rating: e.rating ?? 0,
  }));

  const intensityCounts = evals.reduce<Record<string, number>>((acc, e) => {
    const k = e.intensity_perceived ?? "sin dato";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const intensityData = Object.entries(intensityCounts).map(([name, value]) => ({ name, value }));

  const lastEight = evals.slice(-8).map((e, i) => ({
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
        <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando gráficos…</p>}>
          <AnalyticsCharts timeline={timeline} intensityData={intensityData} lastEight={lastEight} />
        </Suspense>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
