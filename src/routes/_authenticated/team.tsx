import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TEAM_CATEGORIES, labelOf } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string(),
  age_group: z.string().trim().max(50).optional().or(z.literal("")),
  season: z.string().trim().max(20).optional().or(z.literal("")),
  match_day: z.enum(["saturday", "sunday"]),
});

function TeamPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ["teams", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: any = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message);
    if (!user) return;
    const { error } = await (supabase.from("teams") as any).insert({
      owner_id: user.id, ...parsed.data,
      age_group: parsed.data.age_group || null, season: parsed.data.season || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Equipo creado");
    qc.invalidateQueries({ queryKey: ["teams"] });
    setOpen(false);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este equipo?")) return;
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["teams"] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipos</h1>
          <p className="text-sm text-muted-foreground">Crea tus equipos: categoría, temporada y día de partido.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Nuevo equipo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo equipo</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" required maxLength={120} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <input type="hidden" name="category" id="hidden-cat" defaultValue="amateur" />
                  <Select defaultValue="amateur" onValueChange={(v) => { (document.getElementById("hidden-cat") as HTMLInputElement).value = v; }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TEAM_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Día de partido</Label>
                  <input type="hidden" name="match_day" id="hidden-md" defaultValue="sunday" />
                  <Select defaultValue="sunday" onValueChange={(v) => { (document.getElementById("hidden-md") as HTMLInputElement).value = v; }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saturday">Sábado</SelectItem>
                      <SelectItem value="sunday">Domingo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="age_group">Edad</Label><Input id="age_group" name="age_group" placeholder="Sub-15" /></div>
                <div className="space-y-1.5"><Label htmlFor="season">Temporada</Label><Input id="season" name="season" placeholder="2025/26" /></div>
              </div>
              <div className="flex justify-end"><Button type="submit">Crear</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t: any) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{labelOf(TEAM_CATEGORIES, t.category)}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.age_group && <Badge variant="outline">{t.age_group}</Badge>}
                {t.season && <Badge variant="outline">{t.season}</Badge>}
                <Badge variant="secondary">{t.match_day === "saturday" ? "Sábado" : "Domingo"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><Users className="h-6 w-6" /></div>
          <p className="font-medium">Aún no tienes equipos</p>
          <p className="mt-1 text-sm text-muted-foreground">Crea tu primer equipo para empezar a planificar.</p>
        </Card>
      )}
    </div>
  );
}
