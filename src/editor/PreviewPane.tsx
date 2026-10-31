import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { CV } from '../types';
import { CVDocument, pageSize } from '../cv/CVDocument';

interface Props {
  cv: CV;
  active: string | null;
  onSelect: (id: string) => void;
}

export function PreviewPane({ cv, active, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.8);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [docHeight, setDocHeight] = useState(1123);
  const [pages, setPages] = useState(1);
  const size = pageSize(cv);
  const scale = zoom === 'fit' ? fit : zoom;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, Math.max(0.3, (el.clientWidth - 56) / size.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.width]);

  useLayoutEffect(() => {
    const el = docRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDocHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPagesChange = useCallback((n: number) => setPages(n), []);
  const paged = cv.style.pageFormat !== 'continuous';
  const step = (dir: 1 | -1) => setZoom(Math.min(2, Math.max(0.3, Math.round((scale + dir * 0.1) * 10) / 10)));

  return (
    <div className="preview">
      <div className="preview-scroll" ref={scrollRef}>
        <div className="preview-stage" style={{ width: size.width * scale, height: docHeight * scale }}>
          <div className="preview-doc" ref={docRef} style={{ width: size.width, transform: `scale(${scale})` }}>
            <CVDocument
              cv={cv}
              editing
              activeSectionId={active}
              onSectionClick={onSelect}
              onHeaderClick={() => onSelect('header')}
              onPagesChange={onPagesChange}
            />
            {paged &&
              Array.from({ length: pages - 1 }, (_, i) => (
                <div key={i} className="page-break" style={{ top: (i + 1) * size.height }}>
                  <span>Page {i + 2}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="preview-toolbar">
        <span className="muted">
          {paged ? `${pages} page${pages > 1 ? 's' : ''}` : 'Single page'} · click a section to edit it
        </span>
        <div className="zoom">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Zoom out" title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-value">{Math.round(scale * 100)}%</span>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Zoom in" title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className={`icon-btn${zoom === 'fit' ? ' is-active' : ''}`}
            onClick={() => setZoom('fit')}
            aria-label="Fit to width"
            title="Fit to width"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
