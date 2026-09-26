import { useEffect, useRef, useState } from "react";
import { ArrowRight, Circle, Cone, Copy, FileDown, Goal, ImageDown, Maximize2, Minimize2, Pause, Play, Plus, Redo2, Square, Trash2, Undo2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORMATIONS, buildFormationElements } from "@/lib/tactical-board-formations";
import { TacticalBoardTemplateLibrary } from "@/components/tactical-board-template-library";

type ElementType = "player" | "opponent" | "ball" | "cone" | "goal" | "arrow" | "zone";
export type TacticalElement = { id: string; type: ElementType; x: number; y: number; x2?: number; y2?: number; label?: string; color?: string };
export type TacticalBoardStep = { id: string; name: string; elements: TacticalElement[] };
export type PitchMode = "full" | "half";
export type TacticalBoardData = {
  version: 1 | 2;
  title: string;
  elements: TacticalElement[];
  steps?: TacticalBoardStep[];
  pitchMode?: PitchMode;
};

const palette: { type: ElementType; label: string; icon: typeof Circle }[] = [
  { type: "player", label: "Jugador", icon: Circle },
  { type: "opponent", label: "Rival", icon: Circle },
  { type: "ball", label: "Balón", icon: Circle },
  { type: "cone", label: "Cono", icon: Cone },
  { type: "goal", label: "Portería", icon: Goal },
  { type: "arrow", label: "Flecha", icon: ArrowRight },
  { type: "zone", label: "Zona", icon: Square },
];

const colors: Record<ElementType, string> = { player: "#38bdf8", opponent: "#fb7185", ball: "#f8fafc", cone: "#f59e0b", goal: "#e2e8f0", arrow: "#a7f3d0", zone: "#34d399" };
const SWATCHES = ["#38bdf8", "#fb7185", "#f8fafc", "#f59e0b", "#e2e8f0", "#a7f3d0", "#34d399", "#a78bfa", "#facc15", "#f472b6"];
const PLAY_INTERVAL_MS = 1200;

function uid() { return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

/** Rectángulo porcentual (left/top/width/height) de una zona a partir de sus dos esquinas x/y y x2/y2. */
export function zoneRect(element: TacticalElement) {
  const endX = element.x2 ?? Math.min(96, element.x + 24);
  const endY = element.y2 ?? Math.min(94, element.y + 24);
  const left = Math.min(element.x, endX);
  const top = Math.min(element.y, endY);
  return { left, top, width: Math.abs(endX - element.x), height: Math.abs(endY - element.y) };
}

function normalizeSteps(value?: TacticalBoardData | null): TacticalBoardStep[] {
  if (value?.steps?.length) return value.steps;
  return [{ id: uid(), name: "Paso 1", elements: value?.elements ?? [] }];
}

export function TacticalBoard({ value, onChange, readOnly = false }: { value?: TacticalBoardData | null; onChange?: (value: TacticalBoardData) => void; readOnly?: boolean }) {
  const [steps, setSteps] = useState<TacticalBoardStep[]>(() => normalizeSteps(value));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, TacticalElement[][]>>({});
  const [future, setFuture] = useState<Record<string, TacticalElement[][]>>({});
  const [title, setTitle] = useState(value?.title ?? "Pizarra táctica");
  const [pitchMode, setPitchMode] = useState<PitchMode>(value?.pitchMode ?? "full");
  const [playing, setPlaying] = useState(false);
  const [formationChoice, setFormationChoice] = useState(FORMATIONS[0].id);
  const boardRef = useRef<HTMLDivElement>(null);

  const activeStep = steps[activeStepIndex] ?? steps[0];
  const elements = activeStep.elements;

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const interval = setInterval(() => setActiveStepIndex((i) => (i + 1) % steps.length), PLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [playing, steps.length]);

  useEffect(() => {
    if (readOnly) return;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      else if (mod && ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y")) { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicate(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selected) { e.preventDefault(); removeSelected(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function pushSteps(nextSteps: TacticalBoardStep[], nextActiveIndex: number = activeStepIndex) {
    setSteps(nextSteps);
    if (nextActiveIndex !== activeStepIndex) setActiveStepIndex(nextActiveIndex);
    onChange?.({ version: 2, title, elements: nextSteps[nextActiveIndex]?.elements ?? [], steps: nextSteps, pitchMode });
  }
  function commit(next: TacticalElement[]) {
    const stepId = activeStep.id;
    setHistory((h) => ({ ...h, [stepId]: [...(h[stepId] ?? []).slice(-19), elements] }));
    setFuture((f) => ({ ...f, [stepId]: [] }));
    pushSteps(steps.map((s, i) => i === activeStepIndex ? { ...s, elements: next } : s));
  }
  function updateTitle(next: string) {
    setTitle(next);
    onChange?.({ version: 2, title: next, elements, steps, pitchMode });
  }
  function updatePitchMode(next: PitchMode) {
    setPitchMode(next);
    onChange?.({ version: 2, title, elements, steps, pitchMode: next });
  }
  function nextNumber(type: ElementType): string {
    const used = new Set(elements.filter((e) => e.type === type).map((e) => Number(e.label)).filter((n) => Number.isFinite(n)));
    let n = 1;
    while (used.has(n)) n++;
    return String(n);
  }
  function add(type: ElementType) {
    const x = type === "goal" ? 85 : 50;
    const y = type === "goal" ? 50 : 50 + (elements.length % 4) * 8 - 12;
    const extra = type === "arrow" ? { x2: Math.min(90, x + 18), y2: Math.max(10, y - 14) } : type === "zone" ? { x2: 72, y2: 70 } : {};
    const label = type === "player" || type === "opponent" ? nextNumber(type) : undefined;
    const next = [...elements, { id: uid(), type, x, y, color: colors[type], ...(label ? { label } : {}), ...extra }];
    commit(next); setSelected(next.at(-1)?.id ?? null);
  }
  function update(id: string, patch: Partial<TacticalElement>) { commit(elements.map((e) => e.id === id ? { ...e, ...patch } : e)); }
  function duplicate() {
    const target = elements.find((e) => e.id === selected);
    if (!target) return;
    const clone: TacticalElement = { ...target, id: uid(), x: Math.min(97, target.x + 4), y: Math.min(95, target.y + 4) };
    if (clone.x2 !== undefined) clone.x2 = Math.min(97, clone.x2 + 4);
    if (clone.y2 !== undefined) clone.y2 = Math.min(97, clone.y2 + 4);
    commit([...elements, clone]);
    setSelected(clone.id);
  }
  function removeSelected() { if (selected) { commit(elements.filter((e) => e.id !== selected)); setSelected(null); } }
  function applyFormation(side: "player" | "opponent") {
    const pieces = buildFormationElements(formationChoice, side, colors[side]);
    if (!pieces.length) return;
    commit([...elements.filter((e) => e.type !== side), ...pieces]);
    setSelected(null);
  }
  function undo() {
    const stepId = activeStep.id;
    const previous = history[stepId]?.at(-1);
    if (!previous) return;
    setFuture((f) => ({ ...f, [stepId]: [...(f[stepId] ?? []), elements] }));
    setHistory((h) => ({ ...h, [stepId]: h[stepId].slice(0, -1) }));
    pushSteps(steps.map((s, i) => i === activeStepIndex ? { ...s, elements: previous } : s));
  }
  function redo() {
    const stepId = activeStep.id;
    const next = future[stepId]?.at(-1);
    if (!next) return;
    setHistory((h) => ({ ...h, [stepId]: [...(h[stepId] ?? []), elements] }));
    setFuture((f) => ({ ...f, [stepId]: f[stepId].slice(0, -1) }));
    pushSteps(steps.map((s, i) => i === activeStepIndex ? { ...s, elements: next } : s));
  }

  function addStep(duplicateCurrent: boolean) {
    setPlaying(false);
    const newStep: TacticalBoardStep = { id: uid(), name: `Paso ${steps.length + 1}`, elements: duplicateCurrent ? elements.map((e) => ({ ...e })) : [] };
    setSelected(null);
    pushSteps([...steps, newStep], steps.length);
  }
  function removeStep(index: number) {
    if (steps.length <= 1) return;
    setPlaying(false);
    const nextSteps = steps.filter((_, i) => i !== index);
    setSelected(null);
    pushSteps(nextSteps, Math.min(activeStepIndex, nextSteps.length - 1));
  }
  function goToStep(index: number) {
    setPlaying(false);
    setActiveStepIndex(index);
    setSelected(null);
  }

  /** Arrastra un punto individual del elemento: "primary" = x/y, "secondary" = x2/y2 (punta de flecha o esquina de zona). */
  function dragPoint(id: string, point: "primary" | "secondary", event: React.PointerEvent) {
    if (readOnly) return;
    event.stopPropagation();
    setSelected(id);
    const rect = boardRef.current?.getBoundingClientRect(); if (!rect) return;
    const target = elements.find((e) => e.id === id); if (!target) return;
    const startX = event.clientX; const startY = event.clientY;
    const ox = point === "primary" ? target.x : target.x2 ?? target.x + 15;
    const oy = point === "primary" ? target.y : target.y2 ?? target.y - 15;
    const baseline = elements;
    const patchAt = (clientX: number, clientY: number): Partial<TacticalElement> => {
      const dx = (clientX - startX) / rect.width * 100;
      const dy = (clientY - startY) / rect.height * 100;
      const nx = Math.max(3, Math.min(97, ox + dx));
      const ny = Math.max(5, Math.min(95, oy + dy));
      return point === "primary" ? { x: nx, y: ny } : { x2: nx, y2: ny };
    };
    const onMove = (moveEvent: PointerEvent) => {
      const patch = patchAt(moveEvent.clientX, moveEvent.clientY);
      setSteps((current) => current.map((s, i) => i === activeStepIndex ? { ...s, elements: s.elements.map((e) => e.id === id ? { ...e, ...patch } : e) } : s));
    };
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const patch = patchAt(upEvent.clientX, upEvent.clientY);
      commit(baseline.map((e) => e.id === id ? { ...e, ...patch } : e));
    };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  /** Traslada un elemento entero (ambos puntos si tiene x2/y2, como una zona). */
  function dragTranslate(id: string, event: React.PointerEvent) {
    if (readOnly) return;
    event.stopPropagation();
    setSelected(id);
    const rect = boardRef.current?.getBoundingClientRect(); if (!rect) return;
    const target = elements.find((e) => e.id === id); if (!target) return;
    const startX = event.clientX; const startY = event.clientY;
    const ox = target.x; const oy = target.y; const ox2 = target.x2; const oy2 = target.y2;
    const baseline = elements;
    const patchAt = (clientX: number, clientY: number): Partial<TacticalElement> => {
      const dx = (clientX - startX) / rect.width * 100;
      const dy = (clientY - startY) / rect.height * 100;
      const patch: Partial<TacticalElement> = { x: Math.max(3, Math.min(97, ox + dx)), y: Math.max(5, Math.min(95, oy + dy)) };
      if (ox2 !== undefined) patch.x2 = Math.max(3, Math.min(97, ox2 + dx));
      if (oy2 !== undefined) patch.y2 = Math.max(5, Math.min(95, oy2 + dy));
      return patch;
    };
    const onMove = (moveEvent: PointerEvent) => {
      const patch = patchAt(moveEvent.clientX, moveEvent.clientY);
      setSteps((current) => current.map((s, i) => i === activeStepIndex ? { ...s, elements: s.elements.map((e) => e.id === id ? { ...e, ...patch } : e) } : s));
    };
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const patch = patchAt(upEvent.clientX, upEvent.clientY);
      commit(baseline.map((e) => e.id === id ? { ...e, ...patch } : e));
    };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  async function exportPdf() {
    const { downloadTacticalBoardPdf } = await import("@/lib/tactical-board-pdf");
    await downloadTacticalBoardPdf({ version: 2, title, elements, steps, pitchMode }, title);
  }
  async function exportImage() {
    const { exportTacticalBoardImage } = await import("@/lib/tactical-board-pdf");
    exportTacticalBoardImage({ version: 2, title, elements, steps, pitchMode }, title);
  }

  const selectedElement = elements.find((e) => e.id === selected) ?? null;
  const canUndo = (history[activeStep.id]?.length ?? 0) > 0;
  const canRedo = (future[activeStep.id]?.length ?? 0) > 0;

  return <div className="space-y-3 rounded-xl border border-border bg-slate-950/80 p-3 text-slate-100 shadow-inner">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><Label className="text-slate-100">Pizarra táctica</Label><p className="text-xs text-slate-400">Añade piezas, arrástralas y crea la secuencia del ejercicio.</p></div>
      <div className="flex flex-wrap items-center gap-1">
        {!readOnly && <>
          <Button type="button" size="icon" variant="ghost" className="text-slate-300" onClick={undo} disabled={!canUndo} aria-label="Deshacer"><Undo2 className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="text-slate-300" onClick={redo} disabled={!canRedo} aria-label="Rehacer"><Redo2 className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" className="text-red-300" onClick={removeSelected} disabled={!selected} aria-label="Borrar elemento"><Trash2 className="h-4 w-4" /></Button>
        </>}
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200" onClick={() => updatePitchMode(pitchMode === "full" ? "half" : "full")} aria-label="Alternar media pista / pista completa">
          {pitchMode === "full" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}{pitchMode === "full" ? "Media pista" : "Pista completa"}
        </Button>
        {!readOnly && <TacticalBoardTemplateLibrary getElements={() => elements} onApply={(loaded) => { commit(loaded); setSelected(null); }} />}
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200" onClick={exportPdf} aria-label="Exportar PDF"><FileDown className="h-3.5 w-3.5" />PDF</Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200" onClick={exportImage} aria-label="Exportar imagen"><ImageDown className="h-3.5 w-3.5" />Imagen</Button>
      </div>
    </div>
    {!readOnly && <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-900 p-2">{palette.map(({ type, label, icon: Icon }) => <Button key={type} type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200 hover:bg-slate-800" onClick={() => add(type)}><Icon className="h-3.5 w-3.5" />{label}</Button>)}</div>}
    {!readOnly && <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-900 p-2 text-xs text-slate-200">
      <Users className="h-3.5 w-3.5 text-slate-400" />
      <select value={formationChoice} onChange={(e) => setFormationChoice(e.target.value)} aria-label="Formación" className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100">
        {FORMATIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-slate-200 hover:bg-slate-800" onClick={() => applyFormation("player")}>Aplicar (nuestro)</Button>
      <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-slate-200 hover:bg-slate-800" onClick={() => applyFormation("opponent")}>Aplicar (rival)</Button>
    </div>}
    {!readOnly && selectedElement && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 p-2">
      <Input value={selectedElement.label ?? ""} onChange={(e) => update(selectedElement.id, { label: e.target.value })} placeholder="Etiqueta / número" className="h-8 w-36 border-slate-700 bg-slate-950 text-xs text-slate-100" aria-label="Etiqueta del elemento" />
      <div className="flex items-center gap-1">
        {SWATCHES.map((c) => <button key={c} type="button" aria-label={`Color ${c}`} onClick={() => update(selectedElement.id, { color: c })} className={`h-5 w-5 rounded-full border-2 ${selectedElement.color === c ? "border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />)}
      </div>
      <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200" onClick={duplicate}><Copy className="h-3.5 w-3.5" />Duplicar</Button>
    </div>}
    <div ref={boardRef} className="relative aspect-[1.55] select-none overflow-hidden rounded-lg border-4 border-slate-600 bg-emerald-800 shadow-2xl [perspective:900px]" onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
      <div className="absolute inset-[3%] origin-center rotate-x-2 rounded border-2 border-white/70 bg-[linear-gradient(90deg,transparent_49.5%,rgba(255,255,255,.7)_50%,transparent_50.5%),linear-gradient(0deg,transparent_49.5%,rgba(255,255,255,.7)_50%,transparent_50.5%)] bg-[length:100%_100%,100%_100%] shadow-[inset_0_0_45px_rgba(0,0,0,.35)]">
        {pitchMode === "full" && <>
          <div className="absolute left-1/2 top-1/2 h-[24%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" /><div className="absolute left-1/2 top-0 h-full border-l border-white/60" />
          <div className="absolute left-0 top-1/2 h-[42%] w-[12%] -translate-y-1/2 border-2 border-l-0 border-white/60" />
        </>}
        <div className="absolute right-0 top-1/2 h-[42%] w-[12%] -translate-y-1/2 border-2 border-r-0 border-white/60" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{elements.filter((e) => e.type === "arrow").map((e) => <line key={e.id} x1={e.x} y1={e.y} x2={e.x2 ?? e.x + 15} y2={e.y2 ?? e.y - 15} stroke={e.color} strokeWidth="1.2" markerEnd="url(#arrowhead)" />)}<defs><marker id="arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0 0, 5 2.5, 0 5" fill="#a7f3d0" /></marker></defs></svg>
        {elements.filter((e) => e.type === "zone").map((e) => { const rect = zoneRect(e); return (
          <div key={e.id} onPointerDown={(event) => dragTranslate(e.id, event)} className={`absolute z-10 cursor-grab rounded-lg border-2 border-dashed bg-emerald-300/20 active:cursor-grabbing ${selected === e.id ? "ring-2 ring-white ring-offset-2 ring-offset-emerald-800" : ""}`} style={{ left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%`, borderColor: e.color }} title={e.label ?? "Zona"}>
            {e.label && <span className="absolute left-1 top-1 text-[10px] font-semibold text-white/90">{e.label}</span>}
            {!readOnly && <div onPointerDown={(event) => dragPoint(e.id, "secondary", event)} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-slate-900" aria-label="Redimensionar zona" />}
          </div>
        ); })}
        {elements.filter((e) => e.type === "arrow").map((e) => { const x2 = e.x2 ?? e.x + 15; const y2 = e.y2 ?? e.y - 15; return (
          <div key={e.id}>
            <div onPointerDown={(event) => dragPoint(e.id, "primary", event)} className={`absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 active:cursor-grabbing ${selected === e.id ? "ring-2 ring-white" : ""}`} style={{ left: `${e.x}%`, top: `${e.y}%`, borderColor: e.color, backgroundColor: e.color }} title={e.label ?? "Flecha (origen)"} aria-label="Origen de la flecha" />
            <div onPointerDown={(event) => dragPoint(e.id, "secondary", event)} className={`absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-dashed active:cursor-grabbing ${selected === e.id ? "ring-2 ring-white" : ""}`} style={{ left: `${x2}%`, top: `${y2}%`, borderColor: e.color }} title="Flecha (punta)" aria-label="Punta de la flecha" />
          </div>
        ); })}
        {elements.filter((e) => e.type !== "arrow" && e.type !== "zone").map((e) => <div key={e.id} onPointerDown={(event) => dragPoint(e.id, "primary", event)} className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center active:cursor-grabbing ${e.type === "goal" ? "h-10 w-16 rounded border-2" : e.type === "cone" ? "h-5 w-5 rotate-45 rounded-sm" : e.type === "ball" ? "h-5 w-5 rounded-full border border-slate-900" : "h-7 w-7 rounded-full border-2 font-bold text-[10px]"} ${selected === e.id ? "ring-2 ring-white ring-offset-2 ring-offset-emerald-800" : ""}`} style={{ left: `${e.x}%`, top: `${e.y}%`, backgroundColor: e.color, borderColor: e.color, color: e.type === "ball" ? "#0f172a" : "#fff" }} title={e.label ?? typeLabel(e.type)}>{e.label ?? (e.type === "player" ? "P" : e.type === "opponent" ? "R" : e.type === "ball" ? "●" : e.type === "goal" ? "▥" : "")}</div>)}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-900 p-2">
      {steps.map((step, i) => (
        <span key={step.id} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${i === activeStepIndex ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-slate-800"}`}>
          <button type="button" onClick={() => goToStep(i)}>{step.name}</button>
          {!readOnly && steps.length > 1 && <button type="button" aria-label={`Eliminar ${step.name}`} onClick={() => removeStep(i)}><X className="h-3 w-3" /></button>}
        </span>
      ))}
      {!readOnly && <>
        <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs text-slate-200" onClick={() => addStep(true)}><Copy className="h-3.5 w-3.5" />Duplicar paso</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs text-slate-200" onClick={() => addStep(false)}><Plus className="h-3.5 w-3.5" />Paso vacío</Button>
      </>}
      {steps.length > 1 && <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs text-slate-200" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Detener reproducción" : "Reproducir secuencia"}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{playing ? "Detener" : "Reproducir"}
      </Button>}
    </div>
    {!readOnly && <div className="flex items-center gap-2"><Input value={title} onChange={(e) => updateTitle(e.target.value)} className="h-8 border-slate-700 bg-slate-900 text-xs text-slate-100" placeholder="Nombre de la secuencia" aria-label="Título de la pizarra" /><span className="text-[11px] text-slate-400">{elements.length} elementos</span></div>}
  </div>;
}
function typeLabel(type: ElementType) { return palette.find((p) => p.type === type)?.label ?? type; }
