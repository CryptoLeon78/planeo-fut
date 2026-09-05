import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TacticalBoard, type TacticalBoardData } from "@/components/tactical-board";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveStorageUrl, storagePath, validateImageFile } from "@/lib/storage";
import {
  COMMON_TAGS, GAME_PHASES, INTENSITIES, TASK_TYPES, TEAM_CATEGORIES,
} from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(1, "Nombre obligatorio").max(120),
  objective: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().optional(),
  age_group: z.string().trim().max(50).optional().or(z.literal("")),
  level: z.string().trim().max(50).optional().or(z.literal("")),
  duration_min: z.coerce.number().int().min(1).max(240).optional().or(z.literal("")),
  space: z.string().trim().max(120).optional().or(z.literal("")),
  materials: z.string().trim().max(500).optional().or(z.literal("")),
  players_count: z.coerce.number().int().min(0).max(99).optional().or(z.literal("")),
  intensity: z.string().optional(),
  game_phase: z.string().optional(),
  task_type: z.string().optional(),
  variants: z.string().trim().max(1000).optional().or(z.literal("")),
  observations: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ExerciseFormProps = {
  initial?: any;
  onSaved?: (id: string) => void;
};

export function ExerciseForm({ initial, onSaved }: ExerciseFormProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePath, setImagePath] = useState<string | null>(initial?.image_url ? storagePath(initial.image_url, "exercise-images") : null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tacticalBoard, setTacticalBoard] = useState<TacticalBoardData>(initial?.tactical_board ?? { version: 1, elements: [] });

  useEffect(() => {
    let active = true;
    if (!initial?.image_url) return;
    setImagePath(storagePath(initial.image_url, "exercise-images"));
    resolveStorageUrl("exercise-images", initial.image_url).then((url) => {
      if (active && url) setImageUrl(url);
    });
    return () => { active = false; };
  }, [initial?.image_url]);

  const addTag = (t: string) => {
    const v = t.trim().toLowerCase();
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagInput("");
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      validateImageFile(file);
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("exercise-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const signed = await resolveStorageUrl("exercise-images", fileName);
      if (!signed) throw new Error("No se pudo generar la URL segura de la imagen");
      setImagePath(fileName);
      setImageUrl(signed);
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      toast.error(err?.message ?? "Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: any = Object.fromEntries(fd.entries());
    Object.keys(raw).forEach((k) => { if (raw[k] === "__empty") raw[k] = ""; });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
    }
    if (!user) return toast.error("Sesión expirada");

    const payload: any = {
      owner_id: user.id,
      name: parsed.data.name,
      objective: parsed.data.objective || null,
      category: parsed.data.category || null,
      age_group: parsed.data.age_group || null,
      level: parsed.data.level || null,
      duration_min: parsed.data.duration_min === "" ? null : parsed.data.duration_min,
      space: parsed.data.space || null,
      materials: parsed.data.materials || null,
      players_count: parsed.data.players_count === "" ? null : parsed.data.players_count,
      intensity: parsed.data.intensity || "media",
      game_phase: parsed.data.game_phase || "general",
      task_type: parsed.data.task_type || "global",
      variants: parsed.data.variants || null,
      observations: parsed.data.observations || null,
      tags,
      image_url: imagePath || null,
      tactical_board: tacticalBoard,
    };

    setBusy(true);
    try {
      if (initial?.id) {
        const { error } = await (supabase.from("exercises") as any).update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Ejercicio actualizado");
        qc.invalidateQueries({ queryKey: ["exercises"] });
        onSaved?.(initial.id);
      } else {
        const { data, error } = await (supabase.from("exercises") as any).insert(payload).select("id").single();
        if (error) throw error;
        toast.success("Ejercicio creado");
        qc.invalidateQueries({ queryKey: ["exercises"] });
        onSaved?.(data!.id);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ""} required maxLength={120} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="objective">Objetivo</Label>
        <Textarea id="objective" name="objective" defaultValue={initial?.objective ?? ""} rows={2} maxLength={500} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoría" name="category" defaultValue={initial?.category ?? ""} options={[{ value: "", label: "—" }, ...TEAM_CATEGORIES]} />
        <Field label="Fase del juego" name="game_phase" defaultValue={initial?.game_phase ?? "general"} options={GAME_PHASES} />
        <Field label="Tipo de tarea" name="task_type" defaultValue={initial?.task_type ?? "global"} options={TASK_TYPES} />
        <Field label="Intensidad" name="intensity" defaultValue={initial?.intensity ?? "media"} options={INTENSITIES} />
        <div className="space-y-1.5">
          <Label htmlFor="duration_min">Duración (min)</Label>
          <Input id="duration_min" name="duration_min" type="number" min={1} max={240} defaultValue={initial?.duration_min ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="players_count">Nº jugadores</Label>
          <Input id="players_count" name="players_count" type="number" min={0} max={99} defaultValue={initial?.players_count ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="age_group">Edad / categoría</Label>
          <Input id="age_group" name="age_group" defaultValue={initial?.age_group ?? ""} placeholder="Ej. Sub-15" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" name="level" defaultValue={initial?.level ?? ""} placeholder="Iniciación / Avanzado" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="space">Espacio</Label>
          <Input id="space" name="space" defaultValue={initial?.space ?? ""} placeholder="40×30 m" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="materials">Material</Label>
          <Input id="materials" name="materials" defaultValue={initial?.materials ?? ""} placeholder="Conos, petos, balones…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="variants">Variantes</Label>
        <Textarea id="variants" name="variants" defaultValue={initial?.variants ?? ""} rows={2} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observations">Observaciones</Label>
        <Textarea id="observations" name="observations" defaultValue={initial?.observations ?? ""} rows={2} />
      </div>

      <TacticalBoard value={tacticalBoard} onChange={setTacticalBoard} />

      <div className="space-y-1.5">
        <Label>Foto/Captura del ejercicio</Label>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Ejercicio" className="h-32 w-32 rounded-lg border border-border object-cover" />
            <button
              type="button"
              onClick={() => { setImageUrl(""); setImagePath(null); }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 hover:bg-muted/50">
            <div className="text-center">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-1 text-sm text-muted-foreground">Haz clic para subir una imagen</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF (máx. 5MB)</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Etiquetas</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>
              #{t} ✕
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Añadir etiqueta y pulsar Enter"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {COMMON_TAGS.filter((t) => !tags.includes(t)).slice(0, 8).map((t) => (
            <button key={t} type="button" onClick={() => addTag(t)}
              className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
              + {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={busy}>{initial?.id ? "Guardar cambios" : "Crear ejercicio"}</Button>
      </div>
    </form>
  );
}

function Field({
  label, name, defaultValue, options,
}: { label: string; name: string; defaultValue: string; options: readonly { value: string; label: string }[] }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value || "__empty"} value={o.value || "__empty"}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
