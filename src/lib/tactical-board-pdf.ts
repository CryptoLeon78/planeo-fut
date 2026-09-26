import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { zoneRect, type TacticalBoardData, type TacticalElement } from "@/components/tactical-board";

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const FIELD_X = 54;
const FIELD_Y = 78;
const FIELD_WIDTH = 734;
const FIELD_HEIGHT = 474;

function color(hex: string | undefined, fallback: [number, number, number]) {
  const normalized = (hex ?? "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return rgb(...fallback);
  return rgb(
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  );
}

function point(element: TacticalElement) {
  return {
    x: FIELD_X + (element.x / 100) * FIELD_WIDTH,
    y: FIELD_Y + FIELD_HEIGHT - (element.y / 100) * FIELD_HEIGHT,
  };
}

function zoneBounds(element: TacticalElement) {
  const rect = zoneRect(element);
  return {
    x: FIELD_X + (rect.left / 100) * FIELD_WIDTH,
    y: FIELD_Y + FIELD_HEIGHT - ((rect.top + rect.height) / 100) * FIELD_HEIGHT,
    width: (rect.width / 100) * FIELD_WIDTH,
    height: (rect.height / 100) * FIELD_HEIGHT,
  };
}

function labelFor(element: TacticalElement) {
  if (element.label?.trim()) return element.label.trim().slice(0, 4);
  if (element.type === "player") return "P";
  if (element.type === "opponent") return "R";
  if (element.type === "ball") return "•";
  if (element.type === "goal") return "G";
  return "";
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "pizarra-tactica";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function drawPitchPage(
  page: Awaited<ReturnType<PDFDocument["addPage"]>>,
  fonts: { regular: Awaited<ReturnType<PDFDocument["embedFont"]>>; bold: Awaited<ReturnType<PDFDocument["embedFont"]>> },
  heading: string,
  subheading: string,
  elements: TacticalElement[],
  pitchMode: "full" | "half",
) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.04, 0.07, 0.12) });
  page.drawText(heading, { x: FIELD_X, y: 564, size: 19, font: fonts.bold, color: rgb(0.94, 0.97, 1) });
  page.drawText(subheading, { x: FIELD_X, y: 542, size: 9, font: fonts.regular, color: rgb(0.62, 0.69, 0.78) });

  page.drawRectangle({ x: FIELD_X, y: FIELD_Y, width: FIELD_WIDTH, height: FIELD_HEIGHT, color: rgb(0.03, 0.42, 0.24), borderColor: rgb(0.85, 0.95, 0.9), borderWidth: 2 });
  if (pitchMode === "full") {
    page.drawLine({ start: { x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y }, end: { x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y + FIELD_HEIGHT }, color: rgb(0.85, 0.95, 0.9), thickness: 1 });
    page.drawCircle({ x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y + FIELD_HEIGHT / 2, size: 54, borderColor: rgb(0.85, 0.95, 0.9), borderWidth: 1 });
    page.drawRectangle({ x: FIELD_X, y: FIELD_Y + FIELD_HEIGHT * 0.29, width: FIELD_WIDTH * 0.12, height: FIELD_HEIGHT * 0.42, borderColor: rgb(0.85, 0.95, 0.9), borderWidth: 1 });
  }
  page.drawRectangle({ x: FIELD_X + FIELD_WIDTH * 0.88, y: FIELD_Y + FIELD_HEIGHT * 0.29, width: FIELD_WIDTH * 0.12, height: FIELD_HEIGHT * 0.42, borderColor: rgb(0.85, 0.95, 0.9), borderWidth: 1 });

  for (const element of elements) {
    const elementColor = color(element.color, [0.9, 0.95, 1]);
    if (element.type === "arrow") {
      const start = point(element);
      const end = point({ ...element, x: element.x2 ?? element.x + 15, y: element.y2 ?? element.y - 15 });
      page.drawLine({ start, end, color: elementColor, thickness: 2.5 });
      continue;
    }
    if (element.type === "zone") {
      const bounds = zoneBounds(element);
      page.drawRectangle({ ...bounds, color: elementColor, opacity: 0.18, borderColor: elementColor, borderWidth: 1.5, borderOpacity: 0.9 });
      continue;
    }
    const position = point(element);
    if (element.type === "goal") {
      page.drawRectangle({ x: position.x - 23, y: position.y - 12, width: 46, height: 24, borderColor: elementColor, borderWidth: 2 });
    } else if (element.type === "cone") {
      page.drawRectangle({ x: position.x - 6, y: position.y - 6, width: 12, height: 12, color: elementColor });
    } else {
      page.drawCircle({ x: position.x, y: position.y, size: element.type === "ball" ? 8 : 13, color: elementColor, borderColor: rgb(0.04, 0.07, 0.12), borderWidth: 1 });
    }
    const label = labelFor(element);
    if (label) page.drawText(label, { x: position.x - (label.length * 2.7), y: position.y - 3.5, size: 9, font: fonts.bold, color: element.type === "ball" ? rgb(0.04, 0.07, 0.12) : rgb(1, 1, 1) });
  }
}

/** Descarga un PDF vectorial del diseño táctico: una página por paso cuando el board tiene una secuencia de varios pasos. */
export async function downloadTacticalBoardPdf(board: TacticalBoardData, filename = "pizarra-tactica") {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };
  const title = board.title?.trim() || "Pizarra táctica";
  const pitchMode = board.pitchMode ?? "full";
  const steps = board.steps?.length ? board.steps : [{ id: "current", name: "", elements: board.elements }];

  steps.forEach((step, index) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const subheading = steps.length > 1 ? `PlaneoFUT · diseño táctico · ${step.name || `Paso ${index + 1}`} (${index + 1}/${steps.length})` : "PlaneoFUT · diseño táctico";
    drawPitchPage(page, fonts, title, subheading, step.elements, pitchMode);
  });

  const bytes = await pdf.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  triggerDownload(blob, `${sanitizeFilename(filename)}.pdf`);
}

const IMAGE_SCALE = 2.2;

function rgbToCss({ red, green, blue }: { red: number; green: number; blue: number }) {
  return `rgb(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)})`;
}

/** Convierte un rectángulo en coordenadas PDF (origen abajo-izquierda) a coordenadas canvas (origen arriba-izquierda). */
function rectToCanvas(x: number, y: number, width: number, height: number) {
  return { x: x * IMAGE_SCALE, y: (PAGE_HEIGHT - (y + height)) * IMAGE_SCALE, width: width * IMAGE_SCALE, height: height * IMAGE_SCALE };
}

function pointToCanvas(p: { x: number; y: number }) {
  return { x: p.x * IMAGE_SCALE, y: (PAGE_HEIGHT - p.y) * IMAGE_SCALE };
}

/** Genera y descarga un PNG limpio del diseño táctico, con la misma geometría que el PDF. */
export function exportTacticalBoardImage(board: TacticalBoardData, filename = "pizarra-tactica") {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAGE_WIDTH * IMAGE_SCALE);
  canvas.height = Math.round(PAGE_HEIGHT * IMAGE_SCALE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = IMAGE_SCALE;

  ctx.fillStyle = rgbToCss(rgb(0.04, 0.07, 0.12));
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = rgbToCss(rgb(0.94, 0.97, 1));
  ctx.font = `bold ${19 * s}px Helvetica, Arial, sans-serif`;
  ctx.fillText(board.title?.trim() || "Pizarra táctica", FIELD_X * s, (PAGE_HEIGHT - 564) * s);
  ctx.fillStyle = rgbToCss(rgb(0.62, 0.69, 0.78));
  ctx.font = `${9 * s}px Helvetica, Arial, sans-serif`;
  ctx.fillText("PlaneoFUT · diseño táctico", FIELD_X * s, (PAGE_HEIGHT - 542) * s);

  const field = rectToCanvas(FIELD_X, FIELD_Y, FIELD_WIDTH, FIELD_HEIGHT);
  ctx.fillStyle = rgbToCss(rgb(0.03, 0.42, 0.24));
  ctx.fillRect(field.x, field.y, field.width, field.height);
  ctx.strokeStyle = rgbToCss(rgb(0.85, 0.95, 0.9));
  ctx.lineWidth = 2 * s;
  ctx.strokeRect(field.x, field.y, field.width, field.height);

  const pitchMode = board.pitchMode ?? "full";
  ctx.lineWidth = 1 * s;
  if (pitchMode === "full") {
    const mid = pointToCanvas({ x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y });
    const midEnd = pointToCanvas({ x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y + FIELD_HEIGHT });
    ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(midEnd.x, midEnd.y); ctx.stroke();

    const center = pointToCanvas({ x: FIELD_X + FIELD_WIDTH / 2, y: FIELD_Y + FIELD_HEIGHT / 2 });
    ctx.beginPath(); ctx.arc(center.x, center.y, 54 * s, 0, Math.PI * 2); ctx.stroke();

    const leftBox = rectToCanvas(FIELD_X, FIELD_Y + FIELD_HEIGHT * 0.29, FIELD_WIDTH * 0.12, FIELD_HEIGHT * 0.42);
    ctx.strokeRect(leftBox.x, leftBox.y, leftBox.width, leftBox.height);
  }
  const rightBox = rectToCanvas(FIELD_X + FIELD_WIDTH * 0.88, FIELD_Y + FIELD_HEIGHT * 0.29, FIELD_WIDTH * 0.12, FIELD_HEIGHT * 0.42);
  ctx.strokeRect(rightBox.x, rightBox.y, rightBox.width, rightBox.height);

  for (const element of board.elements) {
    const elementColor = rgbToCss(color(element.color, [0.9, 0.95, 1]));
    if (element.type === "arrow") {
      const start = pointToCanvas(point(element));
      const end = pointToCanvas(point({ ...element, x: element.x2 ?? element.x + 15, y: element.y2 ?? element.y - 15 }));
      ctx.strokeStyle = elementColor; ctx.lineWidth = 2.5 * s;
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      continue;
    }
    if (element.type === "zone") {
      const bounds = zoneBounds(element);
      const rect = rectToCanvas(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.globalAlpha = 0.18; ctx.fillStyle = elementColor; ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.globalAlpha = 0.9; ctx.strokeStyle = elementColor; ctx.lineWidth = 1.5 * s; ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.globalAlpha = 1;
      continue;
    }
    const position = pointToCanvas(point(element));
    if (element.type === "goal") {
      ctx.strokeStyle = elementColor; ctx.lineWidth = 2 * s;
      ctx.strokeRect(position.x - 23 * s, position.y - 12 * s, 46 * s, 24 * s);
    } else if (element.type === "cone") {
      ctx.fillStyle = elementColor;
      ctx.fillRect(position.x - 6 * s, position.y - 6 * s, 12 * s, 12 * s);
    } else {
      ctx.fillStyle = elementColor;
      ctx.beginPath(); ctx.arc(position.x, position.y, (element.type === "ball" ? 8 : 13) * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgbToCss(rgb(0.04, 0.07, 0.12)); ctx.lineWidth = 1 * s; ctx.stroke();
    }
    const label = labelFor(element);
    if (label) {
      ctx.fillStyle = element.type === "ball" ? rgbToCss(rgb(0.04, 0.07, 0.12)) : rgbToCss(rgb(1, 1, 1));
      ctx.font = `bold ${9 * s}px Helvetica, Arial, sans-serif`;
      ctx.fillText(label, position.x - label.length * 2.7 * s, position.y - 3.5 * s + 3 * s);
    }
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    triggerDownload(blob, `${sanitizeFilename(filename)}.png`);
  }, "image/png");
}
