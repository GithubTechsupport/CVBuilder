import { memo } from 'react';
import type { CV } from '../types';
import { CVDocument, pageSize } from '../cv/CVDocument';

/** Static, scaled-down render of the first page of a CV. */
export const CVThumb = memo(function CVThumb({ cv, width }: { cv: CV; width: number }) {
  const size = pageSize(cv);
  const scale = width / size.width;
  return (
    <div className="cv-thumb" style={{ width, height: Math.round(size.height * scale) }} aria-hidden>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: size.width, pointerEvents: 'none' }}>
        <CVDocument cv={cv} />
      </div>
    </div>
  );
});
