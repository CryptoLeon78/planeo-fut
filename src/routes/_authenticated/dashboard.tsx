import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, Dumbbell, Plus, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";
import { queryKeys } from "@/services/query-keys";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: queryKeys.dashboardStats(user?.id),
    enabled: !!user,
    queryFn: () => dashboardService.stats(),
  });

  const { data: recentSessions } = useQuery({
    queryKey: queryKeys.recentSessions(user?.id),
    enabled: !!user,
    queryFn: () => dashboardService.recentSessions(5),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {user?.user_metadata?.full_name ?? "entrenador"} 👋</h1>
        <p className="mt-1 text-muted-foreground">Tu panel de control para diseñar entrenamientos profesionales.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Dumbbell} label="Ejercicios" value={stats?.exercises ?? 0} href="/exercises" />
        <StatCard icon={ClipboardList} label="Sesiones" value={stats?.sessions ?? 0} href="/sessions" />
        <StatCard icon={Users} label="Equipos" value={stats?.teams ?? 0} href="/team" />
        <StatCard icon={Trophy} label="Microciclos" value={stats?.microcycles ?? 0} href="/microcycles" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Sesiones recientes</h2>
            <Button asChild size="sm" variant="ghost"><Link to="/sessions">Ver todas</Link></Button>
          </div>
          {recentSessions && recentSessions.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {recentSessions.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.objective ?? "Sin objetivo"}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost"><Link to="/sessions/$id" params={{ id: s.id }}>Abrir</Link></Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Aún no hay sesiones"
              desc="Crea tu primera sesión combinando ejercicios en bloques."
              action={<Button asChild><Link to="/sessions/new"><Plus className="mr-1 h-4 w-4" /> Nueva sesión</Link></Button>}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Accesos rápidos</h2>
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start"><Link to="/exercises"><Dumbbell className="mr-2 h-4 w-4" /> Nuevo ejercicio</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/sessions/new"><ClipboardList className="mr-2 h-4 w-4" /> Nueva sesión</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/calendar"><Calendar className="mr-2 h-4 w-4" /> Ver calendario</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/team"><Users className="mr-2 h-4 w-4" /> Configurar equipo</Link></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: any; label: string; value: number; href: string }) {
  return (
    <Link to={href} className="block">
      <Card className="p-5 transition hover:border-primary/40 hover:shadow-glow">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
