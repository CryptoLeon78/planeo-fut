import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, HardDriveDownload, Upload, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BACKUP_ENTITIES,
  ENTITY_LABELS,
  backupFileName,
  parseBackupFile,
  toCsv,
  type BackupEntity,
  type BackupRow,
} from "@/lib/backup";
import { exportUserData, importUserData, listDataExports } from "@/lib/backup.functions";

export const Route = createFileRoute("/_authenticated/backup")({
  component: BackupPage,
  head: () => ({
    meta: [
      { title: "Copias de seguridad | PlaneoFUT" },
      { name: "description", content: "Exporta e importa tus ejercicios, sesiones y microciclos en JSON o CSV." },
      { property: "og:title", content: "Copias de seguridad | PlaneoFUT" },
      { property: "og:description", content: "Exporta e importa tu planificación de entrenamiento en JSON o CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function BackupPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<BackupEntity[]>([...BACKUP_ENTITIES]);

  const runExport = useServerFn(exportUserData);
  const runImport = useServerFn(importUserData);
  const runHistory = useServerFn(listDataExports);

  const history = useQuery({
    queryKey: ["data-exports"],
    queryFn: () => runHistory({}),
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "json" | "csv") => {
      const result = await runExport({ data: { entities: selected, format } });
      return { ...result, format };
    },
    onSuccess: ({ payload, recordCount, format }) => {
      if (format === "json") {
        download(JSON.stringify(payload, null, 2), backupFileName("json"), "application/json");
      } else {
        for (const entity of selected) {
          const rows = (payload.entities[entity] ?? []) as BackupRow[];
          if (rows.length === 0) continue;
          download(toCsv(rows), backupFileName("csv", entity), "text/csv");
        }
      }
      toast.success(`Exportados ${recordCount} registros`);
      qc.invalidateQueries({ queryKey: ["data-exports"] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Error al exportar"),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const payload = parseBackupFile(await file.text());
      return runImport({ data: { payload } });
    },
    onSuccess: ({ total }) => {
      toast.success(`Importados ${total} registros`);
      qc.invalidateQueries();
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Error al importar"),
  });

  const busy = exportMutation.isPending || importMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Copias de seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Exporta toda tu planificación en JSON o CSV e impórtala en cualquier momento.
        </p>
      </div>

      <Card className="space-y-4 p-4 md:p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <HardDriveDownload className="h-4 w-4 text-primary" aria-hidden="true" /> Exportar datos
        </h2>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Entidades a exportar</legend>
          {BACKUP_ENTITIES.map((entity) => (
            <div key={entity} className="flex items-center gap-2">
              <Checkbox
                id={`entity-${entity}`}
                checked={selected.includes(entity)}
                onCheckedChange={(checked) =>
                  setSelected((prev) => (checked ? [...new Set([...prev, entity])] : prev.filter((e) => e !== entity)))
                }
              />
              <Label htmlFor={`entity-${entity}`} className="text-sm font-normal">
                {ENTITY_LABELS[entity]}
              </Label>
            </div>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || selected.length === 0} onClick={() => exportMutation.mutate("json")}>
            <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Exportar JSON
          </Button>
          <Button
            variant="outline"
            disabled={busy || selected.length === 0}
            onClick={() => exportMutation.mutate("csv")}
          >
            <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Exportar CSV
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-4 md:p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Upload className="h-4 w-4 text-primary" aria-hidden="true" /> Importar copia
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecciona un archivo JSON generado por PlaneoFUT. Los registros se añaden a tu cuenta como nuevos (no
          sobrescriben los existentes).
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Archivo de copia de seguridad"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importMutation.mutate(file);
            event.target.value = "";
          }}
        />
        <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
          {importMutation.isPending ? "Importando…" : "Seleccionar archivo JSON"}
        </Button>
      </Card>

      <Card className="space-y-4 p-4 md:p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <History className="h-4 w-4 text-primary" aria-hidden="true" /> Historial de operaciones
        </h2>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : history.data && history.data.length > 0 ? (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Últimas exportaciones e importaciones</caption>
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th scope="col" className="py-2 pr-3">Fecha</th>
                  <th scope="col" className="py-2 pr-3">Operación</th>
                  <th scope="col" className="py-2 pr-3">Formato</th>
                  <th scope="col" className="py-2 pr-3">Registros</th>
                  <th scope="col" className="py-2 pr-3">Tamaño</th>
                  <th scope="col" className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((row) => (
                  <tr key={String(row.id)} className="border-b last:border-0">
                    <td className="py-2 pr-3">{new Date(String(row.created_at)).toLocaleString("es-ES")}</td>
                    <td className="py-2 pr-3 capitalize">{String(row.operation)}</td>
                    <td className="py-2 pr-3 uppercase">{String(row.format)}</td>
                    <td className="py-2 pr-3">{Number(row.record_count ?? 0)}</td>
                    <td className="py-2 pr-3">{formatBytes(Number(row.byte_size ?? 0))}</td>
                    <td className="py-2">
                      <Badge variant={row.status === "success" ? "outline" : "destructive"}>{String(row.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no has exportado ni importado datos.</p>
        )}
      </Card>
    </div>
  );
}
