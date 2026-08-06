import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { exportToPdf } from "@/lib/i18n";
import { BLOCK_TYPES, INTENSITIES, labelOf } from "@/lib/constants";
import { SessionEvaluationCard } from "@/components/session-evaluation-card";

export const Route = createFileRoute("/_authenticated/sessions/$id")({
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data: s } = await supabase.from("sessions").select("*").eq("id", id).single();
      const { data: blocks } = await supabase.from("session_blocks").select("*").eq("session_id", id).order("position");
      const blockIds = (blocks ?? []).map((b: any) => b.id);
      const { data: items } = blockIds.length
        ? await supabase.from("session_block_exercises").select("*, exercises(name, duration_min, game_phase, image_url)").in("block_id", blockIds).order("position")
        : { data: [] };
      return { session: s, blocks: blocks ?? [], items: items ?? [] };
    },
  });

  if (isLoading || !data?.session) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  const { session, blocks, items } = data;

  function exportPDF() { exportToPdf(session.name); }

  return (
    <div className="mx-auto max-w-4xl space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate({ to: "/sessions" })}><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/sessions/new" search={{ edit: id }}>
              <Pencil className="mr-1 h-4 w-4" /> Editar
            </Link>
          </Button>
          <Button variant="outline" onClick={exportPDF}><FileDown className="mr-1 h-4 w-4" /> Exportar PDF</Button>
        </div>
      </div>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
        {session.objective && <p className="mt-1 text-muted-foreground">{session.objective}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {session.session_date && <Badge variant="outline">{new Date(session.session_date).toLocaleDateString("es-ES")}</Badge>}
          {session.intensity && <Badge variant="secondary">{labelOf(INTENSITIES, session.intensity)}</Badge>}
          {session.duration_min && <Badge variant="outline">{session.duration_min} min</Badge>}
        </div>
      </header>

      <div className="space-y-3">
        {blocks.map((b: any) => {
          const blockItems = items.filter((it: any) => it.block_id === b.id);
          return (
            <Card key={b.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <Badge variant="secondary">{labelOf(BLOCK_TYPES, b.block_type)}</Badge>
                  <h3 className="mt-2 text-lg font-semibold">{b.name ?? labelOf(BLOCK_TYPES, b.block_type)}</h3>
                </div>
                {b.duration_min && <Badge variant="outline">{b.duration_min}′</Badge>}
              </div>
              {blockItems.length > 0 ? (
                <ol className="space-y-2">
                  {blockItems.map((it: any, idx: number) => (
                    <li key={it.id} className="flex items-start gap-3 rounded-md border border-border/60 bg-secondary/30 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{idx + 1}. {it.exercises?.name}</p>
                        {it.notes && <p className="text-xs text-muted-foreground">{it.notes}</p>}
                        {it.exercises?.image_url && (
                          <img src={it.exercises.image_url} alt={it.exercises.name} className="mt-2 h-24 w-24 rounded border border-border object-cover print:h-32 print:w-32" />
                        )}
                      </div>
                      {it.exercises?.duration_min && <Badge variant="outline" className="shrink-0">{it.exercises.duration_min}′</Badge>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Sin ejercicios en este bloque.</p>
              )}
              {b.notes && <p className="mt-3 text-sm text-muted-foreground">{b.notes}</p>}
            </Card>
          );
        })}
      </div>

      <SessionEvaluationCard sessionId={id} />

      {session.evaluation && (
        <Card className="p-5">
          <h3 className="mb-2 font-semibold">Notas anteriores</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{session.evaluation}</p>
        </Card>
      )}

      <div className="text-xs text-muted-foreground print:hidden">
        <Link to="/sessions" className="hover:text-primary">← Volver a sesiones</Link>
      </div>
    </div>
  );
}
