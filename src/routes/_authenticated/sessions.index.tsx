import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { INTENSITIES, labelOf } from "@/lib/constants";
import { sessionsService } from "@/services/sessions.service";
import { queryKeys } from "@/services/query-keys";

export const Route = createFileRoute("/_authenticated/sessions/")({
  component: SessionsPage,
});

function SessionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions(user?.id),
    enabled: !!user,
    queryFn: () => sessionsService.list(),
  });

  async function duplicate(id: string) {
    try {
      const created = await sessionsService.duplicate(id);
      if (!created) return;
      toast.success("Sesión duplicada");
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta sesión?")) return;
    try {
      await sessionsService.remove(id);
      toast.success("Eliminada");
      qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sesiones</h1>
          <p className="text-sm text-muted-foreground">Agrupa ejercicios en bloques estructurados.</p>
        </div>
        <Button asChild><Link to="/sessions/new"><Plus className="mr-1 h-4 w-4" /> Nueva sesión</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s: any) => (
            <Card key={s.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <Link to="/sessions/$id" params={{ id: s.id }} className="font-semibold hover:text-primary">{s.name}</Link>
                {s.is_template && <Badge variant="outline">Plantilla</Badge>}
              </div>
              {s.objective && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.objective}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.intensity && <Badge variant="secondary">{labelOf(INTENSITIES, s.intensity)}</Badge>}
                {s.duration_min && <Badge variant="outline">{s.duration_min}′</Badge>}
                {s.session_date && <Badge variant="outline">{new Date(s.session_date).toLocaleDateString("es-ES")}</Badge>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/sessions/$id" params={{ id: s.id }}>Abrir</Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => duplicate(s.id)} aria-label="Duplicar"><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <p className="font-medium">Aún no tienes sesiones</p>
          <p className="mt-1 text-sm text-muted-foreground">Combina ejercicios en bloques: calentamiento, parte principal, juego y vuelta a la calma.</p>
          <Button className="mt-4" asChild><Link to="/sessions/new"><Plus className="mr-1 h-4 w-4" /> Crear sesión</Link></Button>
        </Card>
      )}
    </div>
  );
}
