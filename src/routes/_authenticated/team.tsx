import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Users, Upload, X, Edit2 } from "lucide-react";

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
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showTeamDetail, setShowTeamDetail] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ["teams", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: players } = useQuery({
    queryKey: ["players", selectedTeam?.id],
    enabled: !!selectedTeam?.id && !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("players").select("*").eq("team_id", selectedTeam.id).order("number");
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

  async function handleShieldUpload(teamId: string, file: File) {
    if (!user) return;
    try {
      const fileName = `${user.id}/shield-${teamId}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("team-images")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("team-images").getPublicUrl(fileName);
      await (supabase.from("teams") as any).update({ shield_url: data.publicUrl }).eq("id", teamId);
      qc.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Escudo actualizado");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir el escudo");
    }
  }

  async function addPlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTeam || !user) return;
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const number = fd.get("number") as string;
    const position = fd.get("position") as string;

    const { error } = await (supabase as any).from("players").insert({
      team_id: selectedTeam.id,
      owner_id: user.id,
      name,
      number: number ? parseInt(number) : null,
      position: position || null,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["players", selectedTeam.id] });
    (e.target as HTMLFormElement).reset();
    toast.success("Jugador añadido");
  }

  async function handlePlayerPhotoUpload(playerId: string, file: File) {
    if (!user) return;
    try {
      const fileName = `${user.id}/player-${playerId}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("team-images")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("team-images").getPublicUrl(fileName);
      await (supabase as any).from("players").update({ photo_url: data.publicUrl }).eq("id", playerId);
      qc.invalidateQueries({ queryKey: ["players", selectedTeam?.id] });
      toast.success("Foto del jugador actualizada");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir la foto");
    }
  }

  async function removePlayer(playerId: string) {
    if (!confirm("¿Eliminar este jugador?")) return;
    const { error } = await (supabase as any).from("players").delete().eq("id", playerId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["players", selectedTeam?.id] });
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
          <p className="text-sm text-muted-foreground">Crea tus equipos: categoría, temporada, escudo y jugadores.</p>
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {t.shield_url ? (
                      <img src={t.shield_url} alt={t.name} className="h-10 w-10 rounded border border-border object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded border border-dashed border-border bg-muted">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{labelOf(TEAM_CATEGORIES, t.category)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Editar equipo ${t.name}`} onClick={() => { setSelectedTeam(t); setShowTeamDetail(true); }}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`Eliminar equipo ${t.name}`} onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
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

      {showTeamDetail && selectedTeam && (
        <Dialog open={showTeamDetail} onOpenChange={setShowTeamDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{selectedTeam.name}</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Escudo del equipo</Label>
                <div className="flex items-center gap-3">
                  {selectedTeam.shield_url ? (
                    <div className="relative">
                      <img src={selectedTeam.shield_url} alt={selectedTeam.name} className="h-20 w-20 rounded border border-border object-cover" />
                      <label className="absolute -right-2 -top-2 cursor-pointer rounded-full bg-primary p-1 text-primary-foreground hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleShieldUpload(selectedTeam.id, e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 hover:bg-muted/50">
                      <div className="text-center">
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                        <p className="mt-1 text-xs text-muted-foreground">Subir escudo</p>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleShieldUpload(selectedTeam.id, e.target.files[0])} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Jugadores</Label>
                </div>
                <form onSubmit={addPlayer} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Input name="number" type="number" placeholder="Número" min={0} max={99} />
                    <Input name="name" placeholder="Nombre" required />
                    <Input name="position" placeholder="Posición" />
                  </div>
                  <Button type="submit" size="sm" className="w-full"><Plus className="mr-1 h-4 w-4" /> Añadir jugador</Button>
                </form>

                {players && players.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {players.map((p: any) => (
                      <Card key={p.id} className="p-3">
                        <div className="flex items-start gap-2">
                          {p.photo_url ? (
                            <div className="relative">
                              <img src={p.photo_url} alt={p.name} className="h-12 w-12 rounded-full border border-border object-cover" />
                              <label className="absolute -right-1 -top-1 cursor-pointer rounded-full bg-primary p-0.5 text-primary-foreground hover:bg-primary/90">
                                <Upload className="h-3 w-3" />
                                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePlayerPhotoUpload(p.id, e.target.files[0])} className="hidden" />
                              </label>
                            </div>
                          ) : (
                            <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-border bg-muted hover:bg-muted/80">
                              <Upload className="h-4 w-4 text-muted-foreground" />
                              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePlayerPhotoUpload(p.id, e.target.files[0])} className="hidden" />
                            </label>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{p.number ? `#${p.number}` : ""} {p.name}</p>
                            {p.position && <p className="text-xs text-muted-foreground">{p.position}</p>}
                          </div>
                          <Button size="icon" variant="ghost" aria-label={`Eliminar jugador ${p.name}`} onClick={() => removePlayer(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin jugadores aún.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
