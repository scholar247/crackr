'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, File as FileIcon, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatFileSize } from '@/lib/utils';

interface MediaItem {
  id: string;
  slug: string;
  originalFileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

/**
 * "My Media" — talks only to the /api/v1/media/* routes, no knowledge of storage
 * providers or file paths. Deliberately generic (not "resume uploader" or "profile photo
 * picker") so any future feature can reuse it or its fetch calls as a reference.
 */
export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/media/my?page=${targetPage}&pageSize=${PAGE_SIZE}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not load media');
      setItems(json.data);
      setTotal(json.meta.total);
      setTotalPages(json.meta.totalPages);
      setPage(json.meta.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (customSlug.trim()) formData.append('slug', customSlug.trim());
      const res = await fetch('/api/v1/media', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      toast.success('File uploaded');
      setCustomSlug('');
      await load(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/v1/media/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Could not delete file');
      }
      toast.success('File deleted');
      setItems((prev) => prev.filter((item) => item.slug !== slug));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Media</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Files you&apos;ve uploaded — up to 5 MB each.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="Custom URL slug (optional)"
            className="h-10 w-56"
            disabled={uploading}
          />
          <input ref={fileInputRef} type="file" id="media-upload-input" className="hidden" onChange={handleFileChosen} disabled={uploading} />
          <Button asChild disabled={uploading}>
            <label htmlFor="media-upload-input" className="cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload file'}
            </label>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No files uploaded yet.</p>
      ) : (
        <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((item) => (
            <MediaRow key={item.id} item={item} onDelete={() => handleDelete(item.slug)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} file{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => load(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaRow({ item, onDelete }: { item: MediaItem; onDelete: () => void }) {
  const isImage = item.mimeType.startsWith('image/');
  const isPdf = item.mimeType === 'application/pdf';
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- served through our own /api/v1/media/:slug/content route, not an optimizable static asset
          <img src={item.url} alt="" className="h-full w-full object-cover" />
        ) : isPdf ? (
          <FileText className="h-5 w-5 text-muted-foreground" />
        ) : (
          <FileIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.originalFileName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatFileSize(item.size)} · {item.mimeType} · {formatDate(item.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="outline" size="icon-sm">
          <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open file">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onDelete} aria-label="Delete file">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
