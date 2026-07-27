import { jsPDF } from "jspdf";

const MARGIN = 50;
const PAGE_HEIGHT = 792; // US Letter, points
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN;
const ACCENT = [30, 41, 59]; // slate-800 — dark, professional, still clearly "branded"

function safeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "-").trim();
}

// jsPDF's default (non-embedded) core fonts don't reliably render the same glyph
// across every PDF viewer for anything outside plain ASCII — smart quotes, en/em
// dashes, and especially the Unicode bullet (•) have been observed rendering as
// garbage in some viewers. Everything going into the PDF is normalized to safe,
// universally-supported ASCII so this can't happen regardless of viewer.
function sanitizeForPdf(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\n\t]/g, "");
}

function firstNonEmptyLine(text) {
  return (text.split("\n").find((l) => l.trim()) || "CV").trim();
}

function isSectionHeader(line) {
  const t = line.trim();
  if (!t || t.length > 45) return false;
  const letters = t.replace(/[^A-Za-z]/g, "");
  return letters.length > 2 && t === t.toUpperCase();
}

function isBullet(line) {
  return /^\s*[-*]\s+/.test(line);
}

function newDoc() {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setFont("helvetica", "normal");
  return doc;
}

function drawRule(doc, y) {
  doc.setFillColor(...ACCENT);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 1, "F");
}

/** Renders plain CV text into a properly typeset, text-selectable (ATS-parseable) PDF. */
export function exportCvPdf(rawCvText, { company, role } = {}) {
  const doc = newDoc();
  const cvText = sanitizeForPdf(rawCvText);
  const lines = cvText.split("\n");
  let y = MARGIN;

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      y += 8;
      return;
    }

    if (idx === 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(...ACCENT);
      doc.text(line.trim(), MARGIN, y);
      doc.setTextColor(0);
      y += 22;
      return;
    }

    if (idx === 1 && !isSectionHeader(line)) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(110);
      doc.text(line.trim(), MARGIN, y);
      doc.setTextColor(0);
      y += 22;
      return;
    }

    if (isSectionHeader(line)) {
      if (y > BOTTOM_LIMIT - 24) {
        doc.addPage();
        y = MARGIN;
      }
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...ACCENT);
      doc.text(line.trim(), MARGIN, y);
      doc.setTextColor(0);
      drawRule(doc, y + 4);
      y += 18;
      return;
    }

    const bullet = isBullet(line);
    const indent = bullet ? MARGIN + 12 : MARGIN;
    const text = bullet ? `- ${line.trim().replace(/^[-*]\s*/, "")}` : line.trim();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - (indent - MARGIN));
    wrapped.forEach((wLine) => {
      if (y > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(wLine, indent, y);
      y += 13;
    });
  });

  const name = firstNonEmptyLine(cvText);
  const parts = [name, "CV", role, company].filter(Boolean);
  doc.save(`${safeFilename(parts.join(" - "))}.pdf`);
}

/** Renders plain cover letter text into a cleanly wrapped, text-selectable PDF. */
export function exportCoverLetterPdf(rawLetterText, { company, role } = {}) {
  const doc = newDoc();
  const letterText = sanitizeForPdf(rawLetterText);
  doc.setFontSize(11);
  let y = MARGIN;

  const paragraphs = letterText.split(/\n\s*\n/);
  paragraphs.forEach((para) => {
    const wrapped = doc.splitTextToSize(para.trim(), CONTENT_WIDTH);
    wrapped.forEach((line) => {
      if (y > BOTTOM_LIMIT) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += 15;
    });
    y += 12;
  });

  const parts = ["Cover Letter", role, company].filter(Boolean);
  doc.save(`${safeFilename(parts.join(" - "))}.pdf`);
}
