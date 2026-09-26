import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { TacticalElement } from "@/components/tactical-board";

type TacticalBoardTemplateRow = { id: string; name: string; payload: { elements?: TacticalElement[] } };

/** Guardar/cargar diseños de pizarra reutilizables entre ejercicios, sobre la tabla genérica template_library (kind='tactical_board'). */
export function TacticalBoardTemplateLibrary({ getElements, onApply }: { getElements: () => TacticalElement[]; onApply: (elements: TacticalElement[]) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const queryKey = ["tactical-board-templates", user?.id];

  const { data: templates, isLoading } = useQuery({
    queryKey,
    enabled: open && !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("template_library") as any)
        .select("id,name,payload")
        .eq("kind", "tactical_board")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TacticalBoardTemplateRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (templateName: string) => {
      if (!user) throw new Error("Sesión expirada");
      const { data: category, error: categoryError } = await (supabase.from("template_categories") as any).select("id").eq("slug", "tactica").single();
      if (categoryError || !category) throw new Error("No se encontró la categoría de plantillas tácticas");
      const { error } = await (supabase.from("template_library") as any).insert({
        category_id: category.id,
        owner_id: user.id,
        kind: "tactical_board",
        name: templateName,
        payload: { version: 1, elements: getElements() },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plantilla guardada");
      setName("");
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message ?? "No se pudo guardar la plantilla"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("template_library") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plantilla eliminada");
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: any) => toast.error(err?.message ?? "No se pudo eliminar la plantilla"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200" aria-label="Plantillas de pizarra">
          <Bookmark className="h-3.5 w-3.5" />Plantillas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Plantillas de pizarra</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la plantilla" aria-label="Nombre de la plantilla" />
            <Button type="button" disabled={!name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate(name.trim())}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar paso actual"}
            </Button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {!isLoading && !templates?.length && <p className="text-sm text-muted-foreground">Aún no tienes plantillas guardadas.</p>}
            {templates?.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
                <span className="text-sm">{tpl.name}</span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => { onApply(tpl.payload?.elements ?? []); setOpen(false); }}>Cargar</Button>
                  <Button type="button" size="icon" variant="ghost" className="text-red-400" aria-label={`Eliminar plantilla ${tpl.name}`} onClick={() => deleteMutation.mutate(tpl.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
