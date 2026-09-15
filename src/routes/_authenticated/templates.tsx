import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Library, Sparkles, Clock, Users, HelpCircle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { OSO_TEMPLATES, type OsoSessionTemplate } from "@/data/oso-templates";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/templates")({ component: TemplatesPage });

function TemplatesPage() {
  const [selectedAge, setSelectedAge] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("oso-tpl-6-7-01");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: dbData } = useQuery({
    queryKey: ["template-library"],
    queryFn: async () => {
      try {
        const [{ data: categories }, { data: templates }] = await Promise.all([
          (supabase.from("template_categories") as any).select("id,slug,name,description").order("sort_order"),
          (supabase.from("template_library") as any).select("id,category_id,kind,name,description,is_curated,version").eq("is_published", true).order("updated_at", { ascending: false }),
        ]);
        return { categories: categories ?? [], templates: templates ?? [] };
      } catch {
        return { categories: [], templates: [] };
      }
    },
  });

  const filteredOsoTemplates = OSO_TEMPLATES.filter((tpl) => {
    if (selectedAge === "all") return true;
    return tpl.ageGroup === selectedAge;
  });

  const handleCopyTemplate = (template: OsoSessionTemplate) => {
    setCopiedId(template.id);
    toast.success(`Plantilla "${template.title}" lista para importar en tu calendario.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Library className="h-6 w-6 text-primary" />
          Biblioteca de Plantillas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estructuras de sesión curadas del método OSO (6-18 años) con objetivos de ataque, defensa, provocación y evaluación.
        </p>
      </div>

      {/* Age Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={selectedAge} onValueChange={setSelectedAge} className="w-full sm:w-auto">
          <TabsList aria-label="Filtro por etapa de edad">
            <TabsTrigger value="all">Todas las edades</TabsTrigger>
            <TabsTrigger value="6-7">Prebenjamín (6-7)</TabsTrigger>
            <TabsTrigger value="8-9">Benjamín (8-9)</TabsTrigger>
            <TabsTrigger value="10-13">Alevín/Infantil (10-13)</TabsTrigger>
            <TabsTrigger value="14-18">Cadete/Juvenil (14-18)</TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-muted-foreground">
          {filteredOsoTemplates.length} plantillas disponibles
        </span>
      </div>

      {/* OSO Curated Templates Section */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          Plantillas Metodología OSO (Olympic Desde el Oso-CF)
        </h2>

        <div className="grid gap-4">
          {filteredOsoTemplates.map((template) => {
            const isExpanded = expandedId === template.id;
            const isCopied = copiedId === template.id;

            return (
              <Card key={template.id} className="overflow-hidden border-border/80 p-5 transition-all hover:border-primary/40">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{template.ageGroupLabel}</Badge>
                      <Badge variant="outline">{template.season}</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        {template.phase}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">{template.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyTemplate(template)}
                      className="gap-1.5 text-xs"
                      aria-label={`Usar plantilla ${template.title}`}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {isCopied ? "¡Copiado!" : "Usar plantilla"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                      className="gap-1 text-xs"
                      aria-label={isExpanded ? "Ocultar detalles de la plantilla" : "Ver estructura completa de la plantilla"}
                    >
                      {isExpanded ? "Ocultar partes" : "Ver estructura"}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Session Parts */}
                {isExpanded && (
                  <div className="mt-5 space-y-4 rounded-xl bg-muted/30 p-4 border border-border/60">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Duración total: {template.totalDurationMinutes} min
                      </span>
                      <span>{template.parts.length} bloques de trabajo</span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {template.parts.map((part, idx) => (
                        <div key={idx} className="rounded-lg border bg-card p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{part.name}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {part.durationMinutes} min
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{part.description}</p>
                          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span>📐 {part.dimensions}</span>
                            <span>👥 {part.playersFormat}</span>
                          </div>
                          {part.provocacion && (
                            <div className="rounded bg-accent/40 p-2 text-[11px]">
                              <strong className="text-foreground">Provocación:</strong> {part.provocacion}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Closing evaluation question */}
                    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                      <HelpCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-foreground">Pregunta de cierre para evaluación:</strong>
                        <p className="mt-0.5 text-muted-foreground italic">"{template.closingQuestion}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* DB Custom Categories Section */}
      {dbData?.categories && dbData.categories.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-semibold tracking-tight">Otras Categorías de la Comunidad</h2>
          {dbData.categories.map((category: any) => {
            const items = dbData.templates.filter((t: any) => t.category_id === category.id);
            return (
              <section key={category.id} className="space-y-3">
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.length ? (
                    items.map((t: any) => (
                      <Card key={t.id} className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium">{t.name}</h4>
                          <Badge variant="outline">v{t.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.description ?? "Plantilla estándar"}</p>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Próximamente más plantillas en esta categoría.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
