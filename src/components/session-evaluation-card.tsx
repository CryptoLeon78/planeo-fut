import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { INTENSITIES, labelOf } from "@/lib/constants";
import {
  emptyEvaluation as empty,
  sessionEvaluationsService,
  type SessionEvaluation as Evaluation,
} from "@/services/session-evaluations.service";

export function SessionEvaluationCard({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await sessionEvaluationsService.get(sessionId);
      if (active && data) setEvaluation(data);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [sessionId]);

  async function save(patch: Partial<Evaluation>) {
    if (!user) return;
    const next = { ...evaluation, ...patch };
    setEvaluation(next);
    setSaving(true);
    try {
      await sessionEvaluationsService.save(sessionId, user.id, next);
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <Card className="space-y-4 p-5 print:hidden">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Evaluación post-sesión</h3>
          <p className="text-xs text-muted-foreground">Valora cómo fue el entrenamiento. Se guarda automáticamente.</p>
        </div>
        {saving && <span className="text-xs text-muted-foreground">Guardando…</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Valoración global</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => save({ rating: n })}
                className={`grid h-9 w-9 place-items-center rounded-md border ${(evaluation.rating ?? 0) >= n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                <Star className="h-4 w-4" fill={(evaluation.rating ?? 0) >= n ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Intensidad percibida</Label>
          <Select value={evaluation.intensity_perceived ?? undefined} onValueChange={(v) => save({ intensity_perceived: v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {INTENSITIES.map((i) => <SelectItem key={i.value} value={i.value}>{labelOf(INTENSITIES, i.value)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 md:col-span-2">
          <Label className="text-sm">¿Se cumplieron los objetivos?</Label>
          <Switch checked={!!evaluation.objectives_met} onCheckedChange={(v) => save({ objectives_met: v })} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Qué funcionó bien</Label>
          <Textarea rows={3} defaultValue={evaluation.what_worked ?? ""}
            onBlur={(e) => { if (e.target.value !== (evaluation.what_worked ?? "")) save({ what_worked: e.target.value }); }} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Qué mejorar</Label>
          <Textarea rows={3} defaultValue={evaluation.what_to_improve ?? ""}
            onBlur={(e) => { if (e.target.value !== (evaluation.what_to_improve ?? "")) save({ what_to_improve: e.target.value }); }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notas sobre jugadores</Label>
        <Textarea rows={2} defaultValue={evaluation.player_notes ?? ""}
          onBlur={(e) => { if (e.target.value !== (evaluation.player_notes ?? "")) save({ player_notes: e.target.value }); }} />
      </div>

      {evaluation.id && (
        <Button variant="ghost" size="sm" onClick={async () => {
          if (!confirm("¿Borrar evaluación?")) return;
          await sessionEvaluationsService.remove(sessionId);
          setEvaluation(empty);
          toast.success("Evaluación borrada");
        }}>Eliminar evaluación</Button>
      )}
    </Card>
  );
}
