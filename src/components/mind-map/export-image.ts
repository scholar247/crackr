import type { MindMapTheme, MindMapTreeNode } from '@/lib/mind-maps';
import { SIZES, TYPE, expandableIds, layoutMindMap, typeFor, wrapLines } from './layout';

// Standalone image of the whole (fully expanded) map: an SVG built from the same layout as
// the on-screen map, with a title band and a branded footer link — so a shared image brings
// people back to the page. PNG is the SVG rasterised in the browser.

/** Same hues as the on-screen branch palette (palette.ts), as hex for a standalone file. */
const BRANCH_HEX = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899'];
const FONT = "Geist, 'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface ExportOptions {
  title: { eyebrow: string; subject: string; chapter: string };
  nodes: MindMapTreeNode[];
  theme: MindMapTheme;
  /** Footer link, e.g. "syllabuzai.com/exams/…". */
  link: string;
  siteName: string;
}

export function renderMindMapSvg({ title, nodes, theme, link, siteName }: ExportOptions): { svg: string; width: number; height: number } {
  const classic = theme === 'CLASSIC';
  const layout = layoutMindMap(nodes, expandableIds(nodes));
  const byId = new Map<string, MindMapTreeNode>();
  const index = (list: MindMapTreeNode[]) => list.forEach((n) => (byId.set(n.id, n), index(n.children)));
  index(nodes);

  const pad = 48;
  const headerH = 72;
  const footerH = 48;
  const { minX, minY, maxX, maxY } = layout.bounds;
  const width = Math.ceil(maxX - minX + pad * 2);
  const height = Math.ceil(maxY - minY + pad * 2 + headerH + footerH);
  const ox = pad - minX; // map → image coordinates
  const oy = pad + headerH - minY;
  const colour = (branch: number) => (classic ? '#404040' : BRANCH_HEX[branch % BRANCH_HEX.length]);

  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${esc(FONT)}">`);
  out.push(
    '<defs><linearGradient id="centre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f2f2"/><stop offset="1" stop-color="#d9d9d9"/></linearGradient></defs>',
  );
  out.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);

  // Title band
  out.push(`<text x="${pad}" y="34" font-size="13" font-weight="600" fill="#6b7280" letter-spacing="1.5">${esc(`${title.eyebrow} · ${title.subject}`.toUpperCase())}</text>`);
  out.push(`<text x="${pad}" y="60" font-size="24" font-weight="700" fill="#111111">${esc(`${title.chapter} — Mind Map`)}</text>`);

  // Connectors
  out.push(`<g transform="translate(${ox} ${oy})" fill="none" stroke-linecap="round">`);
  for (const l of layout.links) {
    const w = l.depth === 1 ? 3.5 : l.depth === 2 ? 2 : 1.4;
    out.push(`<path d="${l.d}" stroke="${classic ? '#777777' : colour(l.branch)}" stroke-width="${w}"${l.depth > 2 ? ' stroke-opacity="0.7"' : ''}/>`);
  }
  out.push('</g>');

  // Nodes
  out.push(`<g transform="translate(${ox} ${oy})">`);
  for (const n of layout.nodes) {
    const src = byId.get(n.id);
    const t = typeFor(n.depth, src);
    const c = colour(n.branch);
    const heading = !!src?.style?.heading && n.depth > 1;
    const dash = src?.style?.border === 'dashed' ? ' stroke-dasharray="5 4"' : src?.style?.border === 'dotted' ? ' stroke-dasharray="1.5 3"' : '';
    const rx = n.depth === 1 && classic ? n.h / 2 : 12;
    if (heading) {
      out.push(`<line x1="${n.x}" y1="${n.y + n.h - 1}" x2="${n.x + n.w}" y2="${n.y + n.h - 1}" stroke="${c}" stroke-width="2"/>`);
    } else if (n.depth === 1) {
      out.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}" fill="#ffffff"/>`);
      if (!classic) out.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${rx}" fill="${c}" fill-opacity="0.1"/>`);
      out.push(`<rect x="${n.x + 1}" y="${n.y + 1}" width="${n.w - 2}" height="${n.h - 2}" rx="${rx}" fill="none" stroke="${classic ? '#262626' : c}" stroke-width="2"${dash}/>`);
    } else {
      out.push(
        `<rect x="${n.x + 0.5}" y="${n.y + 0.5}" width="${n.w - 1}" height="${n.h - 1}" rx="${rx}" fill="#ffffff" stroke="${classic ? '#a3a3a3' : c}" stroke-opacity="${classic ? 1 : 0.55}"${dash}/>`,
      );
    }

    // Text (wrapped exactly as the layout measured it); left-side boxes mirror the right.
    const dot = n.depth > 1 && !heading ? 16 : 0;
    const mirrored = n.side === -1;
    const content = n.w - t.padX * 2 - dot - (n.depth === 1 ? 8 : 0);
    const lines = wrapLines(n.label, Math.max(40, content), t.font, t.bold);
    const tagsH = src?.tags?.length ? TYPE.tagRow : 0;
    const blockH = lines.length * t.line + tagsH;
    let y = n.y + (n.h - blockH) / 2;
    const tx = mirrored ? n.x + n.w - t.padX - dot : n.x + t.padX + dot;
    const anchor = mirrored ? 'end' : 'start';
    if (dot) out.push(`<circle cx="${mirrored ? n.x + n.w - t.padX - 4 : n.x + t.padX + 4}" cy="${n.y + n.h / 2}" r="4" fill="${c}"/>`);
    for (const line of lines) {
      if (src?.style?.highlight) {
        const lw = Math.min(content, line.length * t.font * 0.56);
        out.push(`<rect x="${mirrored ? tx - lw : tx}" y="${y + t.line * 0.5}" width="${lw}" height="${t.line * 0.42}" fill="#fde047" fill-opacity="0.75"/>`);
      }
      out.push(`<text x="${tx}" y="${y + t.line * 0.76}" font-size="${t.font}" font-weight="${t.bold ? 600 : 400}" fill="#111111" text-anchor="${anchor}">${esc(line)}</text>`);
      y += t.line;
    }
    if (tagsH) out.push(`<text x="${tx}" y="${y + 13}" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="0.6" text-anchor="${anchor}">${esc(src!.tags!.join(' · ').toUpperCase())}</text>`);
  }

  // Centre card
  const cw = SIZES.center.w;
  const ch = SIZES.center.h;
  out.push(
    `<rect x="${-cw / 2}" y="${-ch / 2}" width="${cw}" height="${ch}" rx="16" fill="${classic ? 'url(#centre)' : '#312e81'}" stroke="${classic ? '#d4d4d4' : '#1e1b4b'}" stroke-width="2"/>`,
  );
  const ink = classic ? '#111111' : '#ffffff';
  out.push(`<text x="0" y="-14" font-size="11" font-weight="600" fill="${ink}" fill-opacity="0.75" text-anchor="middle" letter-spacing="1.2">${esc(classic ? siteName : `${title.eyebrow} · ${title.subject}`.toUpperCase())}</text>`);
  const chapterLines = wrapLines(title.chapter, cw - 32, 18, true).slice(0, 2);
  chapterLines.forEach((line, i) => out.push(`<text x="0" y="${12 + i * 22 - (chapterLines.length - 1) * 11}" font-size="18" font-weight="700" fill="${ink}" text-anchor="middle">${esc(line)}</text>`));
  out.push('</g>');

  // Footer: brand + link back to the interactive page
  out.push(`<line x1="${pad}" y1="${height - footerH}" x2="${width - pad}" y2="${height - footerH}" stroke="#e5e7eb"/>`);
  out.push(`<text x="${pad}" y="${height - 18}" font-size="13" font-weight="700" fill="#4f46e5">${esc(siteName)}</text>`);
  out.push(`<text x="${width - pad}" y="${height - 18}" font-size="12" fill="#6b7280" text-anchor="end">${esc(`Interactive map, quiz & flashcards: ${link}`)}</text>`);
  out.push('</svg>');
  return { svg: out.join(''), width, height };
}

/** Rasterises the SVG to a PNG blob in the browser (2× for sharp text, capped for big maps). */
export async function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const scale = Math.min(2, 8000 / Math.max(width, height));
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "life-processes-mind-map" from "Life Processes". */
export function exportFilename(chapter: string, ext: string) {
  const slug = chapter
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'mind'}-mind-map.${ext}`;
}
