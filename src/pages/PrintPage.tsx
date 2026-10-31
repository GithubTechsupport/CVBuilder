import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { CV } from '../types';
import { CVDocument, pageSize } from '../cv/CVDocument';
import { api } from '../lib/api';
import { normalizeCV } from '../lib/factory';

declare global {
  interface Window {
    __renderCV?: (cv: CV) => void;
  }
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Bare page that renders a single CV for printing. Used by the server's headless Chrome
 * (which injects the CV through window.__renderCV) and by the browser-print fallback
 * (/print/:id?autoprint=1).
 */
export default function PrintPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [cv, setCv] = useState<CV | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('print-body');
    window.__renderCV = (data) => setCv(normalizeCV(data));
    if (id) api.get(id).then(setCv, (e) => setError(String(e.message ?? e)));
    return () => {
      document.body.classList.remove('print-body');
      delete window.__renderCV;
    };
  }, [id]);

  useEffect(() => {
    if (!cv) return;
    let cancelled = false;
    delete document.body.dataset.cvReady;
    (async () => {
      await nextFrame();
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {}))),
      );
      // Let the page-count measurement settle.
      await nextFrame();
      await nextFrame();
      await nextFrame();
      if (cancelled) return;

      const el = document.querySelector<HTMLElement>('.cv');
      const size = pageSize(cv);
      const pageRule =
        cv.style.pageFormat === 'continuous'
          ? `@page { size: ${size.width}px ${Math.ceil(el?.getBoundingClientRect().height ?? size.height) + 1}px; margin: 0; }`
          : `@page { size: ${cv.style.pageFormat === 'letter' ? 'letter' : 'A4'}; margin: 0; }`;
      let styleEl = document.getElementById('cv-page-rule');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'cv-page-rule';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = pageRule;
      document.title = cv.name || 'CV';
      document.body.dataset.cvReady = '1';
      if (params.get('autoprint')) window.print();
    })();
    return () => {
      cancelled = true;
    };
  }, [cv, params]);

  if (error) return <p style={{ padding: 24, fontFamily: 'sans-serif' }}>Could not load CV: {error}</p>;
  return cv ? <CVDocument cv={cv} /> : null;
}
