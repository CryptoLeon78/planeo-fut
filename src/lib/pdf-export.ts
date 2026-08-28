import type { PDFPage, PDFFont } from "pdf-lib";

export type PdfSection = { heading: string; lines: string[] };

function drawWrapped(page: PDFPage, font: PDFFont, text: string, x: number, y: number, maxWidth: number, size: number) {
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      page.drawText(line, { x, y, size, font });
      y -= size + 4;
      line = word;
    } else line = candidate;
  }
  if (line) {
    page.drawText(line, { x, y, size, font });
    y -= size + 4;
  }
  return y;
}

/** Generates a deterministic text PDF without relying on browser print CSS. */
export async function downloadStructuredPdf(title: string, subtitle: string, sections: PdfSection[], filename: string) {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = 595.28;
  const height = 841.89;
  const margin = 42;
  let page = pdf.addPage([width, height]);
  let y = height - margin;
  let pageNumber = 1;

  const footer = () => page.drawText(`PlaneoFUT · Página ${pageNumber}`, {
    x: margin, y: 22, size: 8, font: regular,
  });
  const ensureSpace = (needed: number) => {
    if (y - needed >= 42) return;
    footer();
    page = pdf.addPage([width, height]);
    pageNumber += 1;
    y = height - margin;
  };

  page.drawText(title.slice(0, 120), { x: margin, y, size: 20, font: bold });
  y -= 28;
  y = drawWrapped(page, regular, subtitle, margin, y, width - margin * 2, 10);
  y -= 10;

  for (const section of sections) {
    ensureSpace(28);
    page.drawText(section.heading.slice(0, 120), { x: margin, y, size: 13, font: bold });
    y -= 20;
    for (const line of section.lines) {
      ensureSpace(18);
      y = drawWrapped(page, regular, `• ${line}`, margin + 8, y, width - margin * 2 - 8, 10);
      y -= 2;
    }
    y -= 8;
  }
  footer();

  const bytes = await pdf.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
