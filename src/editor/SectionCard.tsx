import { useEffect, useRef } from 'react';
import { ArrowLeftRight, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { LevelStyle, ListStyle, Section } from '../types';
import { KIND_INFO } from '../lib/catalog';
import { DragHandle, type DragHandleProps } from '../components/Sortable';
import { Menu } from '../components/Menu';
import { SectionBodyEditor, type SectionRecipe } from './SectionBodyEditor';

const SIZE_STEPS = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.3];

interface Props {
  section: Section;
  handle: DragHandleProps;
  open: boolean;
  active: boolean;
  hasSidebar: boolean;
  onToggle: () => void;
  update: (recipe: SectionRecipe) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SectionCard({ section, handle, open, active, hasSidebar, onToggle, update, onDuplicate, onDelete }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [active]);

  return (
    <div ref={ref} className={`section-card${open ? ' is-open' : ''}${active ? ' is-active' : ''}${section.hidden ? ' is-hidden' : ''}`}>
      <div className="section-card-head">
        <DragHandle handle={handle} label="Drag to reorder section" />
        <button type="button" className="section-card-toggle" onClick={onToggle} aria-expanded={open}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="section-card-title">{section.title || 'Untitled section'}</span>
          <span className="tag">{KIND_INFO[section.kind].name}</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => update((s) => void (s.hidden = !s.hidden))}
          title={section.hidden ? 'Show on CV' : 'Hide from CV'}
          aria-label={section.hidden ? 'Show on CV' : 'Hide from CV'}
        >
          {section.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <Menu
          items={[
            {
              label: section.column === 'sidebar' ? 'Move to main column' : 'Move to sidebar',
              icon: <ArrowLeftRight size={15} />,
              hidden: !hasSidebar,
              onSelect: () => update((s) => void (s.column = s.column === 'sidebar' ? 'main' : 'sidebar')),
            },
            { label: 'Duplicate section', icon: <Copy size={15} />, onSelect: onDuplicate },
            { label: 'Delete section', icon: <Trash2 size={15} />, danger: true, onSelect: onDelete },
          ]}
        />
      </div>

      {open && (
        <div className="section-card-body">
          <div className="section-options">
            <label className="field field--grow">
              <span>Section title</span>
              <input className="input" value={section.title} onChange={(e) => update((s) => void (s.title = e.target.value))} />
            </label>
            {section.kind === 'list' && (
              <label className="field">
                <span>Display as</span>
                <select
                  className="input"
                  value={section.listStyle}
                  onChange={(e) => update((s) => void (s.listStyle = e.target.value as ListStyle))}
                >
                  <option value="stacked">Stacked</option>
                  <option value="bullets">Bullets</option>
                  <option value="tags">Tags</option>
                  <option value="inline">Comma separated</option>
                </select>
              </label>
            )}
            {section.kind === 'levels' && (
              <label className="field">
                <span>Show level as</span>
                <select
                  className="input"
                  value={section.levelStyle}
                  onChange={(e) => update((s) => void (s.levelStyle = e.target.value as LevelStyle))}
                >
                  <option value="bar">Bar</option>
                  <option value="dots">Dots</option>
                  <option value="none">Hidden</option>
                </select>
              </label>
            )}
            <label className="field">
              <span>Text size</span>
              <select
                className="input"
                value={String(section.fontScale ?? 1)}
                onChange={(e) => update((s) => void (s.fontScale = Number(e.target.value)))}
              >
                {SIZE_STEPS.map((v) => (
                  <option key={v} value={String(v)}>
                    {Math.round(v * 100)}%{v === 1 ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {hasSidebar && (
            <label className="check">
              <input type="checkbox" checked={section.accentLine} onChange={(e) => update((s) => void (s.accentLine = e.target.checked))} />
              Show decorative line beside content
            </label>
          )}
          <SectionBodyEditor section={section} update={update} />
        </div>
      )}
    </div>
  );
}
