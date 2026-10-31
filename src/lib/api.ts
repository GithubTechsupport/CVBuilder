import type { CV } from '../types';
import { normalizeCV } from './factory';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async list(): Promise<CV[]> {
    return (await json<CV[]>(await fetch('/api/cvs'))).map(normalizeCV);
  },
  async get(id: string): Promise<CV> {
    return normalizeCV(await json<CV>(await fetch(`/api/cvs/${encodeURIComponent(id)}`)));
  },
  async save(cv: CV): Promise<{ updatedAt: string }> {
    return json(
      await fetch(`/api/cvs/${encodeURIComponent(cv.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cv),
      }),
    );
  },
  async remove(id: string): Promise<void> {
    await json(await fetch(`/api/cvs/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  },
  async example(): Promise<CV> {
    return normalizeCV(await json<CV>(await fetch('/api/example')));
  },
  async pdf(cv: CV): Promise<Blob> {
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv, origin: window.location.origin }),
    });
    if (!res.ok) await json(res);
    return res.blob();
  },
};

export function pdfFileName(cv: CV) {
  const who = [cv.profile.firstName, cv.profile.lastName].filter(Boolean).join('_');
  const base = who ? `${who}_CV` : cv.name || 'CV';
  return `${base.replace(/[^\p{L}\p{N}_ -]+/gu, '').trim().replace(/\s+/g, '_') || 'CV'}.pdf`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Download a CV as PDF via the server (headless Chrome). If that fails, fall back to the
 * browser's own print dialog on the /print route, where "Save as PDF" gives the same layout.
 */
export async function downloadPdf(cv: CV): Promise<'server' | 'print'> {
  try {
    const blob = await api.pdf(cv);
    downloadBlob(blob, pdfFileName(cv));
    return 'server';
  } catch (err) {
    console.warn('Server PDF rendering failed, falling back to browser print:', err);
    await api.save(cv).catch(() => {});
    window.open(`/print/${encodeURIComponent(cv.id)}?autoprint=1`, '_blank');
    return 'print';
  }
}
