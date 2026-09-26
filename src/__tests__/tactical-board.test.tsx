import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TacticalBoard, zoneRect, type TacticalBoardData } from "@/components/tactical-board";

const RECT = { width: 400, height: 258, left: 0, top: 0, right: 400, bottom: 258, x: 0, y: 0, toJSON() {} };

function renderBoard(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function lastCall(onChange: ReturnType<typeof vi.fn>): TacticalBoardData {
  return onChange.mock.calls.at(-1)![0];
}

function byLabel(container: HTMLElement, label: string) {
  const el = container.querySelector(`[aria-label="${label}"]`);
  if (!el) throw new Error(`No element with aria-label "${label}"`);
  return el as HTMLElement;
}

function drag(target: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.pointerDown(target, { clientX: from.x, clientY: from.y });
  act(() => { window.dispatchEvent(new PointerEvent("pointermove", { clientX: to.x, clientY: to.y })); });
  act(() => { window.dispatchEvent(new PointerEvent("pointerup", { clientX: to.x, clientY: to.y })); });
}

beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(RECT);
});

describe("TacticalBoard", () => {
  it("añade piezas y autonumera jugadores/rivales", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));
    expect(lastCall(onChange).elements).toHaveLength(1);
    expect(lastCall(onChange).elements[0]).toMatchObject({ type: "player", label: "1" });

    fireEvent.click(screen.getByText("Jugador"));
    expect(lastCall(onChange).elements[1]).toMatchObject({ type: "player", label: "2" });

    expect(byLabel(container, "Deshacer")).not.toBeDisabled();
  });

  it("persiste el título sin afectar el historial de deshacer de las piezas", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    const titleInput = screen.getByPlaceholderText("Nombre de la secuencia");
    fireEvent.change(titleInput, { target: { value: "Ataque posicional" } });

    expect(lastCall(onChange)).toMatchObject({ version: 2, title: "Ataque posicional", elements: [] });
    expect(byLabel(container, "Deshacer")).toBeDisabled();
  });

  it("un arrastre completo genera una única entrada de historial deshacer/rehacer", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Balón"));
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 50, y: 38 });

    const piece = screen.getByTitle("Balón");
    drag(piece, { x: 100, y: 100 }, { x: 140, y: 100 });
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 60, y: 38 });

    // Dos acciones distintas (añadir + arrastrar) deben producir exactamente dos entradas de historial.
    const undo = byLabel(container, "Deshacer");
    fireEvent.click(undo);
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 50, y: 38 });
    expect(byLabel(container, "Deshacer")).not.toBeDisabled();

    fireEvent.click(byLabel(container, "Deshacer"));
    expect(lastCall(onChange).elements).toHaveLength(0);
    expect(byLabel(container, "Deshacer")).toBeDisabled();

    fireEvent.click(byLabel(container, "Rehacer"));
    fireEvent.click(byLabel(container, "Rehacer"));
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 60, y: 38 });
  });

  it("duplica el elemento seleccionado con nuevo id", () => {
    const onChange = vi.fn();
    renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));
    const original = lastCall(onChange).elements[0];

    fireEvent.click(screen.getByText("Duplicar"));
    const elements = lastCall(onChange).elements;
    expect(elements).toHaveLength(2);
    expect(elements[1].id).not.toBe(original.id);
    expect(elements[1]).toMatchObject({ type: "player", color: original.color });
  });

  it("edita etiqueta y color del elemento seleccionado", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));

    const labelInput = screen.getByLabelText("Etiqueta del elemento");
    fireEvent.change(labelInput, { target: { value: "9" } });
    expect(lastCall(onChange).elements[0].label).toBe("9");

    fireEvent.click(byLabel(container, "Color #fb7185"));
    expect(lastCall(onChange).elements[0].color).toBe("#fb7185");
  });

  it("redimensiona una zona desde su handle sin mover la esquina de anclaje", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Zona"));
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 50, y: 38, x2: 72, y2: 70 });

    const handle = byLabel(container, "Redimensionar zona");
    drag(handle, { x: 200, y: 200 }, { x: 240, y: 200 });

    const zone = lastCall(onChange).elements[0];
    expect(zone).toMatchObject({ x: 50, y: 38, x2: 82, y2: 70 });
    expect(zoneRect(zone).width).toBeCloseTo(32);
  });

  it("una flecha se selecciona y su punta se arrastra independientemente del origen", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Flecha"));
    expect(lastCall(onChange).elements[0]).toMatchObject({ x: 50, y: 38, x2: 68, y2: 24 });

    const tip = byLabel(container, "Punta de la flecha");
    drag(tip, { x: 0, y: 0 }, { x: 40, y: 0 });

    const arrow = lastCall(onChange).elements[0];
    expect(arrow).toMatchObject({ x: 50, y: 38, x2: 78, y2: 24 });
    expect(container.querySelector('[aria-label="Etiqueta del elemento"]')).toBeTruthy();
  });

  it("no permite editar en modo solo lectura", () => {
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "Guardado", elements: [{ id: "1", type: "player", x: 50, y: 50, label: "1" }] }} readOnly />);
    expect(screen.queryByText("Jugador")).toBeNull();
    expect(container.querySelector('[aria-label="Deshacer"]')).toBeNull();
    expect(screen.getByTitle("1")).toBeTruthy();
  });

  it("gestiona pasos: duplicar, vacío, historial por paso y borrar", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));
    expect(lastCall(onChange).elements).toHaveLength(1);

    fireEvent.click(screen.getByText("Duplicar paso"));
    let last = lastCall(onChange);
    expect(last.steps).toHaveLength(2);
    expect(last.steps![1].elements).toHaveLength(1);
    expect(last.elements).toHaveLength(1);

    fireEvent.click(screen.getByText("Paso vacío"));
    last = lastCall(onChange);
    expect(last.steps).toHaveLength(3);
    expect(last.elements).toHaveLength(0);

    fireEvent.click(screen.getByText("Paso 1"));
    expect(byLabel(container, "Deshacer")).not.toBeDisabled();

    fireEvent.click(screen.getByText("Paso 3"));
    expect(byLabel(container, "Deshacer")).toBeDisabled();

    fireEvent.click(byLabel(container, "Eliminar Paso 3"));
    expect(lastCall(onChange).steps).toHaveLength(2);
  });

  it("aplica formaciones de sistema reemplazando el bando correspondiente", () => {
    const onChange = vi.fn();
    renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);

    fireEvent.click(screen.getByText("Aplicar (nuestro)"));
    expect(lastCall(onChange).elements.filter((e) => e.type === "player")).toHaveLength(11);

    fireEvent.click(screen.getByText("Aplicar (rival)"));
    let elements = lastCall(onChange).elements;
    expect(elements.filter((e) => e.type === "player")).toHaveLength(11);
    expect(elements.filter((e) => e.type === "opponent")).toHaveLength(11);

    fireEvent.click(screen.getByText("Aplicar (nuestro)"));
    elements = lastCall(onChange).elements;
    expect(elements.filter((e) => e.type === "player")).toHaveLength(11);
    expect(elements.filter((e) => e.type === "opponent")).toHaveLength(11);
  });

  it("alterna entre pista completa y media pista", () => {
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    expect(screen.getByText("Media pista")).toBeTruthy();
    fireEvent.click(byLabel(container, "Alternar media pista / pista completa"));
    expect(lastCall(onChange).pitchMode).toBe("half");
    expect(screen.getByText("Pista completa")).toBeTruthy();
  });

  it("atajos: Ctrl+D duplica y Ctrl+Z deshace el duplicado", () => {
    const onChange = vi.fn();
    renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));
    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    expect(lastCall(onChange).elements).toHaveLength(2);
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(lastCall(onChange).elements).toHaveLength(1);
  });

  it("atajo Supr borra el elemento seleccionado", () => {
    const onChange = vi.fn();
    renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Jugador"));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(lastCall(onChange).elements).toHaveLength(0);
  });

  it("reproducir avanza automáticamente entre pasos y detener lo para", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { container } = renderBoard(<TacticalBoard value={{ version: 1, title: "", elements: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByText("Paso vacío"));
    fireEvent.click(screen.getByText("Paso 1"));

    const activeChip = () => Array.from(container.querySelectorAll("span")).find((c) => c.className.includes("bg-primary"))?.textContent;
    expect(activeChip()).toBe("Paso 1");

    fireEvent.click(byLabel(container, "Reproducir secuencia"));
    act(() => { vi.advanceTimersByTime(1200); });
    expect(activeChip()).toBe("Paso 2");

    act(() => { vi.advanceTimersByTime(1200); });
    expect(activeChip()).toBe("Paso 1");

    fireEvent.click(byLabel(container, "Detener reproducción"));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(activeChip()).toBe("Paso 1");
    vi.useRealTimers();
  });
});
