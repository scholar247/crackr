'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// pdf.js is loaded from cdnjs at runtime (not bundled): it's only needed on the paper
// pages, and the worker must be a separate file anyway. Pinned — bump deliberately.
const PDFJS_VERSION = '4.10.38';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// Just the slice of the pdf.js API this viewer touches.
interface PdfViewport {
  width: number;
  height: number;
}
interface PdfRenderTask {
  promise: Promise<void>;
  cancel(): void;
}
interface PdfPageProxy {
  getViewport(opts: { scale: number }): PdfViewport;
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport; transform?: number[] }): PdfRenderTask;
  cleanup(): void;
}
interface PdfDocumentProxy {
  numPages: number;
  getPage(n: number): Promise<PdfPageProxy>;
}
interface PdfLoadingTask {
  promise: Promise<PdfDocumentProxy>;
  destroy(): Promise<void>;
}
interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { url: string; isEvalSupported?: boolean; enableXfa?: boolean }): PdfLoadingTask;
}

let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${PDFJS_BASE}/pdf.min.mjs`).then((mod: PdfJs) => {
    mod.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
    return mod;
  });
  // Let a failed load (offline, blocked CDN) be retried on the next mount.
  pdfjsPromise.catch(() => (pdfjsPromise = null));
  return pdfjsPromise;
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ASPECT = 1.414; // A4 portrait, until the first page reports its real size

/**
 * Read-only PDF viewer: pages are drawn to <canvas> (no text layer, no toolbar download
 * or print), rendered lazily as they scroll into view, and the usual save/print/copy
 * shortcuts and context menu are blocked while it's on screen. Pair it with a same-origin,
 * inline-only source such as /api/v1/public/sample-papers/{id}/file.
 *
 * This is a deterrent, not DRM — anything shown on screen can be captured.
 */
export function PdfViewer({ src, title, className }: { src: string; title: string; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const [currentPage, setCurrentPage] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  // Load the document. To switch documents, remount with a new `key` rather than
  // changing `src` in place (state isn't reset between sources).
  useEffect(() => {
    let cancelled = false;
    let task: PdfLoadingTask | null = null;

    loadPdfJs()
      .then((pdfjs) => {
        if (cancelled) return;
        task = pdfjs.getDocument({ url: src, isEvalSupported: false, enableXfa: false });
        return task.promise.then(async (loaded) => {
          if (cancelled) return;
          const first = await loaded.getPage(1);
          const vp = first.getViewport({ scale: 1 });
          setAspect(vp.height / vp.width);
          setDoc(loaded);
        });
      })
      .catch(() => {
        if (!cancelled) setError('We couldn’t load this PDF. Check your connection and try again.');
      });

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [src]);

  // Fit pages to the available width.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Block save / print / select-all shortcuts while the viewer is mounted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'a'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen?.();
  }, []);

  const zoom = ZOOM_STEPS[zoomIndex];
  const pageWidth = Math.max(0, Math.floor((width - 32) * zoom)); // 16px padding each side

  return (
    <div
      ref={frameRef}
      className={cn('flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-container-lowest print:hidden', fullscreen && 'rounded-none', className)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
        <p className="text-body-sm truncate text-muted-foreground" aria-live="polite">
          {doc ? `Page ${currentPage} of ${doc.numPages}` : error ? 'Unavailable' : 'Loading…'}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={!doc || zoomIndex === 0} onClick={() => setZoomIndex((i) => i - 1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button type="button" className="text-body-sm w-12 rounded text-center tabular-nums text-muted-foreground hover:text-foreground" onClick={() => setZoomIndex(1)} disabled={!doc} aria-label="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={!doc || zoomIndex === ZOOM_STEPS.length - 1} onClick={() => setZoomIndex((i) => i + 1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        role="document"
        aria-label={title}
        className={cn('relative select-none overflow-auto overscroll-contain', fullscreen ? 'flex-1' : 'h-[75vh] min-h-[420px]')}
        onDragStart={(e) => e.preventDefault()}
      >
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <p className="text-body-md max-w-sm text-muted-foreground">{error}</p>
          </div>
        ) : !doc || pageWidth === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-body-sm">Loading paper…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-4" style={{ minWidth: pageWidth + 32 }}>
            {Array.from({ length: doc.numPages }, (_, i) => (
              <PdfPage key={i + 1} doc={doc} pageNumber={i + 1} width={pageWidth} aspect={aspect} root={scrollRef} onVisible={setCurrentPage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PdfPage({
  doc,
  pageNumber,
  width,
  aspect,
  root,
  onVisible,
}: {
  doc: PdfDocumentProxy;
  pageNumber: number;
  width: number;
  aspect: number;
  root: React.RefObject<HTMLDivElement | null>;
  onVisible: (page: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(pageNumber <= 2);
  // The measured height belongs to the width it was rendered at. After a zoom/resize, a
  // page not yet re-rendered falls back to the estimate for the *new* width instead of
  // keeping a stale height (which made pages jump and lost the reader's place).
  const [rendered, setRendered] = useState<{ width: number; height: number } | null>(null);
  const height = rendered?.width === width ? rendered.height : Math.round(width * aspect);

  // Render once the page is within a screen of the viewport; report the page in view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const lazy = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { root: root.current, rootMargin: '100% 0px' });
    // "Current page" = the page crossing the viewer's horizontal midline. A ratio threshold
    // (e.g. 0.5) can never be met by a page taller than twice the viewer, which froze the
    // counter on "Page 1" at higher zoom.
    const visible = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(pageNumber), {
      root: root.current,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    });
    lazy.observe(el);
    visible.observe(el);
    return () => {
      lazy.disconnect();
      visible.disconnect();
    };
  }, [root, pageNumber, onVisible]);

  useEffect(() => {
    if (!near) return;
    let task: PdfRenderTask | null = null;
    let page: PdfPageProxy | null = null;
    let cancelled = false;

    doc.getPage(pageNumber).then((p) => {
      if (cancelled) return;
      page = p;
      const base = p.getViewport({ scale: 1 });
      const viewport = p.getViewport({ scale: width / base.width });
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      setRendered({ width, height: Math.floor(viewport.height) });

      task = p.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      task.promise.catch(() => {
        /* cancelled by a newer render — expected */
      });
    });

    return () => {
      cancelled = true;
      task?.cancel();
      page?.cleanup();
    };
  }, [doc, pageNumber, width, near]);

  return (
    <div ref={wrapRef} className="relative bg-white shadow-sm ring-1 ring-black/5" style={{ width, height }} aria-label={`Page ${pageNumber}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
