import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["template-library"],
    queryFn: async () => {
      const [{ data: categories, error: categoryError }, { data: templates, error: templateError }] = await Promise.all([
        (supabase.from("template_categories") as any).select("id,slug,name,description").order("sort_order"),
        (supabase.from("template_library") as any).select("id,category_id,kind,name,description,is_curated,version").eq("is_published", true).order("updated_at", { ascending: false }),
      ]);
      if (categoryError) throw categoryError;
      if (templateError) throw templateError;
      return { categories: categories ?? [], templates: templates ?? [] };
    },
  });

  return <div className="mx-auto max-w-6xl space-y-6">
    <div><h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Library className="h-6 w-6 text-primary" /> Biblioteca de plantillas</h1><p className="mt-1 text-sm text-muted-foreground">Estructuras versionadas para acelerar la planificación y mantener criterios compartidos.</p></div>
    {isLoading ? <p className="text-sm text-muted-foreground">Cargando biblioteca…</p> : data?.categories.map((category: any) => {
      const items = data.templates.filter((template: any) => template.category_id === category.id);
      return <section key={category.id} className="space-y-3"><div><h2 className="font-semibold">{category.name}</h2><p className="text-sm text-muted-foreground">{category.description}</p></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{items.length ? items.map((template: any) => <Card key={template.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-medium">{template.name}</h3><Badge variant="outline">v{template.version}</Badge></div><p className="text-sm text-muted-foreground">{template.description ?? "Plantilla profesional"}</p><Badge variant="secondary" className="text-xs"><Sparkles className="mr-1 h-3 w-3" />{template.kind}</Badge></Card>) : <p className="text-sm text-muted-foreground">Próximamente habrá contenido curado en esta categoría.</p>}</div></section>;
    })}
  </div>;
}
