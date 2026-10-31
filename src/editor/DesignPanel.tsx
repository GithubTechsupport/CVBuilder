import { useDeferredValue, useMemo, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { CV, CVStyle, PageFormat, PhotoShape } from '../types';
import { FONTS, PALETTES, TEMPLATES, templateMeta } from '../lib/catalog';
import { applyPalette, paletteColors, withTemplate } from '../lib/style';
import { CVThumb } from '../components/CVThumb';
import type { CVRecipe } from './ContentPanel';

interface Props {
  cv: CV;
  update: (recipe: CVRecipe) => void;
}

export function DesignPanel({ cv, update }: Props) {
  const meta = templateMeta(cv.template);
  const deferred = useDeferredValue(cv);
  const previews = useMemo(() => TEMPLATES.map((t) => ({ t, cv: withTemplate(deferred, t.id) })), [deferred]);

  const setStyle = <K extends keyof CVStyle>(key: K, value: CVStyle[K]) =>
    update((d) => {
      d.style[key] = value;
      if (['accent', 'sidebarBg', 'sidebarText', 'textColor'].includes(key)) d.style.palette = 'custom';
    });

  return (
    <div className="design-panel">
      <Group title="Template">
        <div className="template-grid">
          {previews.map(({ t, cv: preview }) => (
            <button
              key={t.id}
              type="button"
              className={`template-card${cv.template === t.id ? ' is-selected' : ''}`}
              onClick={() =>
                update((d) => {
                  const next = withTemplate(d, t.id);
                  d.template = next.template;
                  d.style = next.style;
                  d.sections = next.sections;
                })
              }
              aria-pressed={cv.template === t.id}
            >
              <CVThumb cv={preview} width={150} />
              <span className="template-card-name">
                {cv.template === t.id && <Check size={14} />} {t.name}
              </span>
              <span className="template-card-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Colours">
        <div className="swatches">
          {PALETTES.map((p) => {
            const c = paletteColors(p, cv.template);
            return (
              <button
                key={p.id}
                type="button"
                className={`swatch${cv.style.palette === p.id ? ' is-selected' : ''}`}
                title={p.name}
                aria-label={`${p.name} colour scheme`}
                onClick={() => update((d) => void (d.style = applyPalette(d.style, p.id, d.template)))}
              >
                <span style={{ background: meta.hasSidebar ? c.sidebarBg : '#fff' }} />
                <span style={{ background: c.accent }} />
              </button>
            );
          })}
        </div>
        <div className="grid-2">
          <ColorField label="Accent" value={cv.style.accent} onChange={(v) => setStyle('accent', v)} />
          <ColorField label="Text" value={cv.style.textColor} onChange={(v) => setStyle('textColor', v)} />
          {meta.hasSidebar && (
            <>
              <ColorField label="Sidebar background" value={cv.style.sidebarBg} onChange={(v) => setStyle('sidebarBg', v)} />
              <ColorField label="Sidebar text" value={cv.style.sidebarText} onChange={(v) => setStyle('sidebarText', v)} />
            </>
          )}
        </div>
      </Group>

      <Group title="Typography">
        <div className="grid-2">
          <label className="field">
            <span>Heading font</span>
            <FontSelect value={cv.style.headingFont} onChange={(v) => setStyle('headingFont', v)} />
          </label>
          <label className="field">
            <span>Body font</span>
            <FontSelect value={cv.style.bodyFont} onChange={(v) => setStyle('bodyFont', v)} />
          </label>
        </div>
        <Slider label="Font size" value={cv.style.fontSize} min={10} max={16} step={0.5} unit="px" onChange={(v) => setStyle('fontSize', v)} />
        <Slider label="Line height" value={cv.style.lineHeight} min={1.15} max={1.9} step={0.01} onChange={(v) => setStyle('lineHeight', v)} />
        <Slider
          label="Section spacing"
          value={cv.style.spacing}
          min={0.5}
          max={1.6}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => setStyle('spacing', v)}
        />
      </Group>

      <Group title="Layout">
        <div className="field">
          <span>Page format</span>
          <Segmented<PageFormat>
            value={cv.style.pageFormat}
            onChange={(v) => setStyle('pageFormat', v)}
            options={[
              { value: 'continuous', label: 'Single long page' },
              { value: 'a4', label: 'A4 pages' },
              { value: 'letter', label: 'US Letter' },
            ]}
          />
          <p className="hint">
            “Single long page” exports one continuous A4-wide page like the example PDF. The paged formats split the CV onto
            standard pages.
          </p>
        </div>
        {meta.hasSidebar && (
          <Slider label="Sidebar width" value={cv.style.sidebarWidth} min={25} max={45} step={1} unit="%" onChange={(v) => setStyle('sidebarWidth', v)} />
        )}
        <div className="field">
          <span>Photo</span>
          <label className="check">
            <input type="checkbox" checked={cv.style.showPhoto} onChange={(e) => setStyle('showPhoto', e.target.checked)} />
            Show photo {!cv.profile.photo && <em className="muted">(upload one under Content → Header &amp; photo)</em>}
          </label>
          <Segmented<PhotoShape>
            value={cv.style.photoShape}
            onChange={(v) => setStyle('photoShape', v)}
            options={[
              { value: 'square', label: 'Square' },
              { value: 'rounded', label: 'Rounded' },
              { value: 'circle', label: 'Circle' },
            ]}
          />
        </div>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="design-group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field color-field">
      <span>{label}</span>
      <span className="color-input">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          className="input"
          value={value}
          onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value)}
          spellCheck={false}
        />
      </span>
    </label>
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: `'${value}'` }}>
      <optgroup label="Sans-serif">
        {FONTS.filter((f) => f.category === 'sans').map((f) => (
          <option key={f.family} value={f.family} style={{ fontFamily: `'${f.family}'` }}>
            {f.family}
          </option>
        ))}
      </optgroup>
      <optgroup label="Serif">
        {FONTS.filter((f) => f.category === 'serif').map((f) => (
          <option key={f.family} value={f.family} style={{ fontFamily: `'${f.family}'` }}>
            {f.family}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="field slider">
      <span>
        {label}
        <output>{format ? format(value) : `${Number(value.toFixed(2))}${unit}`}</output>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-selected' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
