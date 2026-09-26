import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { TacticalBoardData } from "@/components/tactical-board";
import { downloadTacticalBoardPdf, exportTacticalBoardImage } from "@/lib/tactical-board-pdf";

const sampleBoard: TacticalBoardData = {
  version: 1,
  title: "Rondo 4v2",
  elements: [
    { id: "p1", type: "player", x: 30, y: 40, label: "4", color: "#38bdf8" },
    { id: "o1", type: "opponent", x: 60, y: 40, label: "2", color: "#fb7185" },
    { id: "b1", type: "ball", x: 45, y: 40, color: "#f8fafc" },
    { id: "z1", type: "zone", x: 20, y: 20, x2: 60, y2: 60, color: "#34d399", label: "Presión" },
    { id: "a1", type: "arrow", x: 30, y: 40, x2: 55, y2: 25, color: "#a7f3d0" },
    { id: "g1", type: "goal", x: 90, y: 50, color: "#e2e8f0" },
    { id: "c1", type: "cone", x: 15, y: 70, color: "#f59e0b" },
  ],
};

let anchor: HTMLAnchorElement;
let click: ReturnType<typeof vi.spyOn>;
const originalCreateElement = document.createElement.bind(document);

beforeEach(() => {
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() });
  anchor = originalCreateElement("a");
  click = vi.spyOn(anchor, "click").mockImplementation(() => {});
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => (tag === "a" ? anchor : originalCreateElement(tag)));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("downloadTacticalBoardPdf", () => {
  it("genera el PDF sin lanzar excepción y nombra la descarga con el título saneado", async () => {
    await expect(downloadTacticalBoardPdf(sampleBoard, sampleBoard.title)).resolves.toBeUndefined();
    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe("Rondo-4v2.pdf");
  });

  it("usa 'pizarra-tactica' como nombre por defecto si el título saneado queda vacío", async () => {
    await downloadTacticalBoardPdf({ ...sampleBoard, title: "" }, "***");
    expect(anchor.download).toBe("pizarra-tactica.pdf");
  });

  it("un board con varios pasos exporta una página por paso", async () => {
    let capturedBlob: Blob | undefined;
    vi.stubGlobal("URL", { createObjectURL: (blob: Blob) => { capturedBlob = blob; return "blob:mock"; }, revokeObjectURL: vi.fn() });

    const board: TacticalBoardData = {
      version: 2,
      title: "Secuencia de salida",
      elements: [],
      steps: [
        { id: "s1", name: "Paso 1", elements: [{ id: "p1", type: "player", x: 30, y: 40 }] },
        { id: "s2", name: "Paso 2", elements: [{ id: "p1", type: "player", x: 50, y: 40 }] },
        { id: "s3", name: "Paso 3", elements: [{ id: "p1", type: "player", x: 70, y: 40 }] },
      ],
    };
    await downloadTacticalBoardPdf(board, "secuencia");
    expect(capturedBlob).toBeTruthy();
    const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("un board sin pasos (retrocompatible) exporta una sola página", async () => {
    let capturedBlob: Blob | undefined;
    vi.stubGlobal("URL", { createObjectURL: (blob: Blob) => { capturedBlob = blob; return "blob:mock"; }, revokeObjectURL: vi.fn() });

    await downloadTacticalBoardPdf(sampleBoard, sampleBoard.title);
    const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
  });
});

describe("exportTacticalBoardImage", () => {
  it("dibuja el tablero en un canvas sin lanzar excepción", () => {
    expect(() => exportTacticalBoardImage(sampleBoard, sampleBoard.title)).not.toThrow();
  });
});
