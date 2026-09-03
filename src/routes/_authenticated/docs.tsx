import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Info, RotateCcw, Sparkles } from "lucide-react";
import { onboardingStore } from "@/stores/onboarding-store";

export const Route = createFileRoute("/_authenticated/docs")({
  component: ComponentDocs,
});

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
      <Separator />
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ComponentDocs() {
  const [switchOn, setSwitchOn] = useState(false);
  const [progress, setProgress] = useState(40);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Catálogo de Componentes
            <Badge variant="secondary" className="ml-3 align-middle text-xs">
              v1
            </Badge>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Biblioteca visual de los componentes UI utilizados en PlaneoFUT. Cada bloque incluye variantes y estados.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex-shrink-0 gap-2"
          onClick={() => onboardingStore.reset()}
          aria-label="Reiniciar tour de onboarding"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reiniciar tour
        </Button>
      </div>

      {/* Buttons */}
      <Section title="Button" description="Variantes de botón: default, secondary, outline, destructive, ghost, link.">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button disabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Section>

      {/* Badges */}
      <Section title="Badge" description="Etiquetas compactas para estados, categorías e indicadores.">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Section>

      {/* Alerts */}
      <Section title="Alert" description="Mensajes informativos, de éxito y de error.">
        <div className="w-full space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Informativo</AlertTitle>
            <AlertDescription>Este es un mensaje informativo estándar.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Algo salió mal. Revisa los datos e inténtalo de nuevo.</AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs" description="Campos de texto y área de texto.">
        <div className="w-full max-w-sm space-y-3">
          <div className="space-y-1">
            <Label htmlFor="demo-input">Campo de texto</Label>
            <Input id="demo-input" placeholder="Escribe algo..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="demo-textarea">Área de texto</Label>
            <Textarea id="demo-textarea" placeholder="Descripción larga..." rows={3} />
          </div>
        </div>
      </Section>

      {/* Select */}
      <Section title="Select" description="Selector desplegable con opciones.">
        <Select>
          <SelectTrigger className="w-48" aria-label="Seleccionar intensidad">
            <SelectValue placeholder="Intensidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      {/* Switch */}
      <Section title="Switch" description="Interruptor de activación/desactivación.">
        <div className="flex items-center gap-3">
          <Switch id="demo-switch" checked={switchOn} onCheckedChange={setSwitchOn} aria-label="Activar opción demo" />
          <Label htmlFor="demo-switch">{switchOn ? "Activado" : "Desactivado"}</Label>
        </div>
      </Section>

      {/* Progress */}
      <Section title="Progress" description="Barra de progreso con valor configurable.">
        <div className="w-full max-w-sm space-y-3">
          <Progress value={progress} aria-label={`Progreso: ${progress}%`} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
              -10
            </Button>
            <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
              +10
            </Button>
          </div>
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs" description="Navegación por pestañas.">
        <Tabs defaultValue="tab1" className="w-full max-w-md">
          <TabsList aria-label="Pestañas de demostración">
            <TabsTrigger value="tab1">Ejercicios</TabsTrigger>
            <TabsTrigger value="tab2">Sesiones</TabsTrigger>
            <TabsTrigger value="tab3">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card className="mt-2 p-4 text-sm text-muted-foreground">Contenido de Ejercicios</Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card className="mt-2 p-4 text-sm text-muted-foreground">Contenido de Sesiones</Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card className="mt-2 p-4 text-sm text-muted-foreground">Contenido de Analytics</Card>
          </TabsContent>
        </Tabs>
      </Section>

      {/* Dialog */}
      <Section title="Dialog" description="Modal de diálogo para confirmaciones y formularios.">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir diálogo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar acción</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline">Cancelar</Button>
              <Button>Confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip" description="Información contextual al pasar el cursor.">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Botón con tooltip de demostración">
                <Sparkles className="mr-2 h-4 w-4" />
                Hover sobre mí
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Información contextual de ayuda</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton" description="Placeholder de carga mientras se obtienen datos.">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Card" description="Contenedor de superficie con sombra y borde.">
        <Card className="w-60">
          <CardHeader>
            <CardTitle>Microciclo #1</CardTitle>
            <CardDescription>Semana de carga alta</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">5 sesiones · Alta intensidad · 12 ejercicios totales</p>
          </CardContent>
        </Card>
        <Card className="w-60 border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Completado
            </CardTitle>
            <CardDescription>Microciclo finalizado</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">5/5 sesiones</Badge>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
