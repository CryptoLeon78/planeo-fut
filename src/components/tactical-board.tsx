import { useRef, useState } from "react";
import { ArrowRight, Circle, Cone, Goal, Move, Redo2, Square, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ElementType = "player" | "opponent" | "ball" | "cone" | "goal" | "arrow" | "zone";
export type TacticalElement = { id: string; type: ElementType; x: number; y: number; x2?: number; y2?: number; label?: string; color?: string };
export type TacticalBoardData = { version: 1; elements: TacticalElement[] };

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

function uid() { return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export function TacticalBoard({ value, onChange, readOnly = false }: { value?: TacticalBoardData | null; onChange?: (value: TacticalBoardData) => void; readOnly?: boolean }) {
  const [elements, setElements] = useState<TacticalElement[]>(value?.elements ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<TacticalElement[][]>([]);
  const [future, setFuture] = useState<TacticalElement[][]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Pizarra táctica");

  function commit(next: TacticalElement[]) {
    setHistory((h) => [...h.slice(-19), elements]);
    setFuture([]);
    setElements(next);
    onChange?.({ version: 1, elements: next });
  }
  function add(type: ElementType) {
    const x = type === "goal" ? 85 : 50;
    const y = type === "goal" ? 50 : 50 + (elements.length % 4) * 8 - 12;
    const extra = type === "arrow" ? { x2: Math.min(90, x + 18), y2: Math.max(10, y - 14) } : type === "zone" ? { x2: 72, y2: 70 } : {};
    const next = [...elements, { id: uid(), type, x, y, color: colors[type], ...extra }];
    commit(next); setSelected(next.at(-1)?.id ?? null);
  }
  function update(id: string, patch: Partial<TacticalElement>) { commit(elements.map((e) => e.id === id ? { ...e, ...patch } : e)); }
  function removeSelected() { if (selected) { commit(elements.filter((e) => e.id !== selected)); setSelected(null); } }
  function undo() { const previous = history.at(-1); if (!previous) return; setFuture((f) => [...f, elements]); setHistory((h) => h.slice(0, -1)); setElements(previous); onChange?.({ version: 1, elements: previous }); }
  function redo() { const next = future.at(-1); if (!next) return; setHistory((h) => [...h, elements]); setFuture((f) => f.slice(0, -1)); setElements(next); onChange?.({ version: 1, elements: next }); }
  function move(id: string, event: React.PointerEvent) {
    if (readOnly) return;
    const rect = boardRef.current?.getBoundingClientRect(); if (!rect) return;
    const target = elements.find((e) => e.id === id); if (!target) return;
    const startX = event.clientX; const startY = event.clientY; const ox = target.x; const oy = target.y;
    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width * 100; const dy = (moveEvent.clientY - startY) / rect.height * 100;
      const patch: Partial<TacticalElement> = { x: Math.max(3, Math.min(97, ox + dx)), y: Math.max(5, Math.min(95, oy + dy)) };
      setElements((current) => current.map((e) => e.id === id ? { ...e, ...patch } : e));
    };
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const dx = (upEvent.clientX - startX) / rect.width * 100;
      const dy = (upEvent.clientY - startY) / rect.height * 100;
      const next = elements.map((e) => e.id === id ? { ...e, x: Math.max(3, Math.min(97, ox + dx)), y: Math.max(5, Math.min(95, oy + dy)) } : e);
      setElements(next);
      onChange?.({ version: 1, elements: next });
    };
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  }

  return <div className="space-y-3 rounded-xl border border-border bg-slate-950/80 p-3 text-slate-100 shadow-inner">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><Label className="text-slate-100">Pizarra táctica 3D</Label><p className="text-xs text-slate-400">Añade piezas, arrástralas y crea la secuencia del ejercicio.</p></div>
      {!readOnly && <div className="flex items-center gap-1"><Button type="button" size="icon" variant="ghost" className="text-slate-300" onClick={undo} disabled={!history.length} aria-label="Deshacer"><Undo2 className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-slate-300" onClick={redo} disabled={!future.length} aria-label="Rehacer"><Redo2 className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-red-300" onClick={removeSelected} disabled={!selected} aria-label="Borrar elemento"><Trash2 className="h-4 w-4" /></Button></div>}
    </div>
    {!readOnly && <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-900 p-2">{palette.map(({ type, label, icon: Icon }) => <Button key={type} type="button" size="sm" variant="ghost" className="h-8 gap-1 text-xs text-slate-200 hover:bg-slate-800" onClick={() => add(type)}><Icon className="h-3.5 w-3.5" />{label}</Button>)}</div>}
    <div ref={boardRef} className="relative aspect-[1.55] select-none overflow-hidden rounded-lg border-4 border-slate-600 bg-emerald-800 shadow-2xl [perspective:900px]" onPointerDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
      <div className="absolute inset-[3%] origin-center rotate-x-2 rounded border-2 border-white/70 bg-[linear-gradient(90deg,transparent_49.5%,rgba(255,255,255,.7)_50%,transparent_50.5%),linear-gradient(0deg,transparent_49.5%,rgba(255,255,255,.7)_50%,transparent_50.5%)] bg-[length:100%_100%,100%_100%] shadow-[inset_0_0_45px_rgba(0,0,0,.35)]">
        <div className="absolute left-1/2 top-1/2 h-[24%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" /><div className="absolute left-1/2 top-0 h-full border-l border-white/60" />
        <div className="absolute left-0 top-1/2 h-[42%] w-[12%] -translate-y-1/2 border-2 border-l-0 border-white/60" /><div className="absolute right-0 top-1/2 h-[42%] w-[12%] -translate-y-1/2 border-2 border-r-0 border-white/60" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{elements.filter((e) => e.type === "arrow").map((e) => <line key={e.id} x1={e.x} y1={e.y} x2={e.x2 ?? e.x + 15} y2={e.y2 ?? e.y - 15} stroke={e.color} strokeWidth="1.2" markerEnd="url(#arrowhead)" />)}<defs><marker id="arrowhead" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><polygon points="0 0, 5 2.5, 0 5" fill="#a7f3d0" /></marker></defs></svg>
        {elements.filter((e) => e.type !== "arrow").map((e) => <div key={e.id} onPointerDown={(event) => { event.stopPropagation(); setSelected(e.id); move(e.id, event); }} className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center active:cursor-grabbing ${e.type === "zone" ? "h-[24%] w-[24%] rounded-lg border-2 border-dashed bg-emerald-300/20" : e.type === "goal" ? "h-10 w-16 rounded border-2" : e.type === "cone" ? "h-5 w-5 rotate-45 rounded-sm" : e.type === "ball" ? "h-5 w-5 rounded-full border border-slate-900" : "h-7 w-7 rounded-full border-2 font-bold text-[10px]"} ${selected === e.id ? "ring-2 ring-white ring-offset-2 ring-offset-emerald-800" : ""}`} style={{ left: `${e.x}%`, top: `${e.y}%`, backgroundColor: e.type === "zone" ? undefined : e.color, borderColor: e.color, color: e.type === "ball" ? "#0f172a" : "#fff" }} title={e.label ?? typeLabel(e.type)}>{e.type === "player" ? "P" : e.type === "opponent" ? "R" : e.type === "ball" ? "●" : e.type === "goal" ? "▥" : e.type === "zone" ? "Z" : ""}</div>)}
      </div>
    </div>
    {!readOnly && <div className="flex items-center gap-2"><Move className="h-4 w-4 text-slate-400" /><Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 border-slate-700 bg-slate-900 text-xs text-slate-100" placeholder="Nombre de la secuencia" /><span className="text-[11px] text-slate-400">{elements.length} elementos</span></div>}
  </div>;
}
function typeLabel(type: ElementType) { return palette.find((p) => p.type === type)?.label ?? type; }
