import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/constants";
import { planningService, validateMesocycleInput } from "@/services/planning.service";
import { queryKeys } from "@/services/query-keys";

export const Route = createFileRoute("/_authenticated/preseason/")({
  component: PreseasonPage,
});

function PreseasonPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: `Pretemporada ${new Date().getFullYear()}`,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    goals: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.mesocycles("pretemporada", user?.id),
    enabled: !!user,
    queryFn: () => planningService.list("pretemporada"),
  });

  async function onCreate() {
    if (!user) return;
    const input = {
      ownerId: user.id,
      name: form.name,
      startDate: form.start_date,
      endDate: form.end_date,
      goals: form.goals,
    };
    const invalid = validateMesocycleInput(input);
    if (invalid) return toast.error(invalid);
    try {
      await planningService.create("pretemporada", input);
      toast.success("Pretemporada creada");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["mesocycles", "pretemporada"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar pretemporada?")) return;
    try {
      await planningService.remove(id);
      qc.invalidateQueries({ queryKey: ["mesocycles", "pretemporada"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pretemporada</h1>
          <p className="text-sm text-muted-foreground">Diseña el bloque de pretemporada con sus fases.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Nueva pretemporada</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva pretemporada</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Objetivos generales</Label>
                <Textarea rows={3} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
              </div>
              <Button onClick={onCreate} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p>
        : data && data.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.map((m: any) => (
              <Card key={m.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <Link to="/preseason/$id" params={{ id: m.id }} className="font-semibold hover:text-primary">{m.name}</Link>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(m.start_date)} → {formatDate(m.end_date)}
                </p>
                {m.goals && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{m.goals}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(m.phases ?? []).map((p: any) => (
                    <span key={p.key} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.label}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><Sun className="h-6 w-6" /></div>
            <p className="font-medium">Aún no tienes pretemporada</p>
            <p className="mt-1 text-sm text-muted-foreground">Crea bloques con fases (acondicionamiento, técnico-táctico, competitivo) y asocia microciclos.</p>
          </Card>
        )}
    </div>
  );
}
