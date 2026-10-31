import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CV, Profile, Section } from '../types';
import { fontStack, templateMeta } from '../lib/catalog';
import { isEmptyHtml, linkFor, sanitize } from '../lib/html';
import './fonts';
import './cv.css';

export const PAGE_SIZES = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
} as const;

export function pageSize(cv: CV) {
  return cv.style.pageFormat === 'letter' ? PAGE_SIZES.letter : PAGE_SIZES.a4;
}

type Place = 'main' | 'sidebar';

interface RenderCtx {
  /** Editing preview: show empty sections as placeholders and allow click-to-select. */
  editing: boolean;
  activeSectionId?: string | null;
}

export interface CVDocumentProps {
  cv: CV;
  editing?: boolean;
  activeSectionId?: string | null;
  onSectionClick?: (id: string) => void;
  onHeaderClick?: () => void;
  /** Called with the number of pages when the page count changes (paged formats). */
  onPagesChange?: (pages: number) => void;
}

export function CVDocument({ cv, editing = false, activeSectionId, onSectionClick, onHeaderClick, onPagesChange }: CVDocumentProps) {
  const { style } = cv;
  const meta = templateMeta(cv.template);
  const size = pageSize(cv);
  const innerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);

  // Grow the page to a whole number of pages so backgrounds (sidebar) fill the last page.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => {
      const n = Math.max(1, Math.ceil((el.offsetHeight - 2) / size.height));
      setPages((prev) => (prev === n ? prev : n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.height]);

  useLayoutEffect(() => {
    onPagesChange?.(pages);
  }, [pages, onPagesChange]);

  const paged = style.pageFormat !== 'continuous';
  const vars = {
    '--accent': style.accent,
    '--sb-bg': style.sidebarBg,
    '--sb-fg': style.sidebarText,
    '--fg': style.textColor,
    '--font-h': fontStack(style.headingFont),
    '--font-b': fontStack(style.bodyFont),
    '--fs': `${style.fontSize}px`,
    '--lh': String(style.lineHeight),
    '--sp': String(style.spacing),
    '--sb-w': `${style.sidebarWidth}%`,
    '--page-w': `${size.width}px`,
    '--page-h': `${size.height}px`,
    width: size.width,
    minHeight: paged ? pages * size.height : size.height,
  } as CSSProperties;

  const visible = cv.sections.filter((s) => !s.hidden && (editing || hasContent(s)));
  const ctx: RenderCtx = { editing, activeSectionId };

  const handleClick = (e: React.MouseEvent) => {
    if (!editing) return;
    const target = e.target as HTMLElement;
    if (target.closest('a')) e.preventDefault();
    const sec = target.closest<HTMLElement>('[data-section-id]');
    if (sec?.dataset.sectionId) return onSectionClick?.(sec.dataset.sectionId);
    if (target.closest('[data-cv-header]')) onHeaderClick?.();
  };

  const main = meta.hasSidebar ? visible.filter((s) => s.column === 'main') : visible;
  const side = meta.hasSidebar ? visible.filter((s) => s.column === 'sidebar') : [];
  const photo = style.showPhoto && cv.profile.photo ? cv.profile.photo : null;

  let body: ReactNode;
  switch (cv.template) {
    case 'modern':
      body = (
        <>
          <header className="cv-band" data-cv-header>
            {photo && <Photo src={photo} shape={style.photoShape} />}
            <div className="cv-band-text">
              <NameBlock profile={cv.profile} />
              <ContactLine profile={cv.profile} />
            </div>
          </header>
          <div className="cv-cols">
            <main className="cv-main">{main.map((s) => renderSection(s, 'main', ctx))}</main>
            <aside className="cv-side">{side.map((s) => renderSection(s, 'sidebar', ctx))}</aside>
          </div>
        </>
      );
      break;
    case 'classic':
      body = (
        <>
          <header className="cv-head" data-cv-header>
            {photo && <Photo src={photo} shape={style.photoShape} />}
            <NameBlock profile={cv.profile} />
            <ContactLine profile={cv.profile} separator="·" />
          </header>
          <main className="cv-main">{main.map((s) => renderSection(s, 'main', ctx))}</main>
        </>
      );
      break;
    case 'swiss':
      body = (
        <>
          <header className="cv-head" data-cv-header>
            <div className="cv-head-text">
              <NameBlock profile={cv.profile} />
              <ContactLine profile={cv.profile} />
            </div>
            {photo && <Photo src={photo} shape={style.photoShape} />}
          </header>
          <main className="cv-main">{main.map((s) => renderSection(s, 'main', ctx))}</main>
        </>
      );
      break;
    case 'monochrome':
    default:
      body = (
        <div className="cv-cols">
          <aside className="cv-side">
            {photo && <Photo src={photo} shape={style.photoShape} />}
            <div className="cv-side-inner">
              <header className="cv-id" data-cv-header>
                <NameBlock profile={cv.profile} />
                <ContactLine profile={cv.profile} stacked />
              </header>
              {side.map((s) => renderSection(s, 'sidebar', ctx))}
            </div>
          </aside>
          <main className="cv-main">{main.map((s) => renderSection(s, 'main', ctx))}</main>
        </div>
      );
  }

  return (
    <div
      className={`cv t-${cv.template}${meta.hasSidebar ? ' has-sidebar' : ''}${paged ? ' is-paged' : ''}${
        editing ? ' is-editing' : ''
      } photo-${style.photoShape}`}
      style={vars}
      onClick={handleClick}
    >
      <div className="cv-inner" ref={innerRef}>
        {body}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

export function hasContent(s: Section): boolean {
  switch (s.kind) {
    case 'text':
      return !isEmptyHtml(s.content);
    case 'entries':
      return s.entries.some((e) => e.title || e.subtitle || e.date || e.location || !isEmptyHtml(e.description));
    case 'list':
      return s.items.some((i) => i.text.trim());
    case 'details':
      return s.details.some((d) => d.label.trim() || d.value.trim());
    case 'levels':
      return s.levels.some((l) => l.name.trim());
  }
}

function RichText({ html, className = '' }: { html: string; className?: string }) {
  if (isEmptyHtml(html)) return null;
  return <div className={`rt ${className}`} dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;
}

function Value({ text }: { text: string }) {
  const href = linkFor(text);
  return href ? <a href={href}>{text}</a> : <>{text}</>;
}

function Photo({ src, shape }: { src: string; shape: string }) {
  return (
    <div className={`cv-photo cv-photo--${shape}`}>
      <img src={src} alt="" />
    </div>
  );
}

function NameBlock({ profile }: { profile: Profile }) {
  const first = profile.firstName.trim();
  const last = profile.lastName.trim();
  return (
    <>
      <h1 className="cv-name">
        {!first && !last ? (
          <span className="cv-placeholder">Your Name</span>
        ) : (
          <>
            {first && <span className="cv-first">{first}</span>}
            {first && last && ' '}
            {last && <span className="cv-last">{last}</span>}
          </>
        )}
      </h1>
      {profile.headline.trim() && <div className="cv-headline">{profile.headline}</div>}
    </>
  );
}

function ContactLine({ profile, separator, stacked = false }: { profile: Profile; separator?: string; stacked?: boolean }) {
  const parts = [profile.email, profile.phone, profile.location, profile.website].map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={`cv-contact${stacked ? ' is-stacked' : ''}`}>
      {parts.map((p, i) => (
        <span key={i} className="cv-contact-item">
          {separator && i > 0 && <span className="cv-sep">{separator}</span>}
          <Value text={p} />
        </span>
      ))}
    </div>
  );
}

function renderSection(section: Section, place: Place, ctx: RenderCtx) {
  const empty = !hasContent(section);
  const cls = [
    'cv-sec',
    `cv-sec--${section.kind}`,
    `cv-sec--${section.preset}`,
    section.accentLine ? 'has-line' : '',
    empty ? 'is-empty' : '',
    ctx.editing && ctx.activeSectionId === section.id ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <section key={section.id} className={cls} data-section-id={section.id}>
      <h2 className="cv-h">{section.title || 'Untitled section'}</h2>
      <div className="cv-sec-body" style={section.fontScale && section.fontScale !== 1 ? { fontSize: `${section.fontScale}em` } : undefined}>
        {empty ? <div className="cv-placeholder">Empty section — add content in the editor</div> : <SectionBody section={section} place={place} />}
      </div>
    </section>
  );
}

function SectionBody({ section, place }: { section: Section; place: Place }) {
  switch (section.kind) {
    case 'text':
      return <RichText html={section.content} />;

    case 'entries':
      return (
        <div className="cv-entries">
          {section.entries
            .filter((e) => e.title || e.subtitle || e.date || e.location || !isEmptyHtml(e.description))
            .map((e) => {
              const sub = [e.subtitle, e.location].map((x) => x.trim()).filter(Boolean).join(' | ');
              return (
                <div key={e.id} className="cv-entry">
                  <div className="cv-entry-head">
                    {e.title && <div className="cv-entry-title">{e.title}</div>}
                    {e.date && <div className="cv-entry-date">{e.date}</div>}
                    {sub && <div className="cv-entry-sub">{sub}</div>}
                  </div>
                  <RichText html={e.description} className="cv-entry-desc" />
                </div>
              );
            })}
        </div>
      );

    case 'list': {
      const items = section.items.filter((i) => i.text.trim());
      if (section.listStyle === 'inline') {
        return <p className="cv-list-inline">{items.map((i) => i.text.trim()).join(', ')}</p>;
      }
      return (
        <ul className={`cv-list cv-list--${section.listStyle}`}>
          {items.map((i) => (
            <li key={i.id}>{i.text}</li>
          ))}
        </ul>
      );
    }

    case 'details':
      return (
        <dl className={`cv-details cv-details--${place}`}>
          {section.details
            .filter((d) => d.label.trim() || d.value.trim())
            .map((d) => (
              <div key={d.id} className="cv-detail">
                {d.label.trim() && <dt>{d.label}</dt>}
                <dd>
                  <Value text={d.value} />
                </dd>
              </div>
            ))}
        </dl>
      );

    case 'levels':
      return (
        <div className={`cv-levels cv-levels--${section.levelStyle}`}>
          {section.levels
            .filter((l) => l.name.trim())
            .map((l) => (
              <div key={l.id} className="cv-level">
                <span className="cv-level-name">{l.name}</span>
                {section.levelStyle === 'bar' && (
                  <span className="cv-bar">
                    <i style={{ width: `${Math.max(0, Math.min(100, l.level))}%` }} />
                  </span>
                )}
                {section.levelStyle === 'dots' && (
                  <span className="cv-dots">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i key={n} className={l.level >= n * 20 - 10 ? 'on' : ''} />
                    ))}
                  </span>
                )}
              </div>
            ))}
        </div>
      );
  }
}
