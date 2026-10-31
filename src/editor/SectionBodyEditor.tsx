import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import type { Entry, Section } from '../types';
import { entryLabels } from '../lib/catalog';
import { newEntry, uid } from '../lib/factory';
import { stripHtml } from '../lib/html';
import { DragHandle, SortableList } from '../components/Sortable';
import { RichTextEditor } from './RichTextEditor';

export type SectionRecipe = (draft: Section) => void;

interface Props {
  section: Section;
  update: (recipe: SectionRecipe) => void;
}

export function SectionBodyEditor({ section, update }: Props) {
  switch (section.kind) {
    case 'text':
      return (
        <RichTextEditor
          value={section.content}
          onChange={(html) => update((s) => void (s.content = html))}
          placeholder="Write something…"
          minHeight={110}
        />
      );
    case 'entries':
      return <EntriesEditor section={section} update={update} />;
    case 'list':
      return <ListEditor section={section} update={update} />;
    case 'details':
      return <DetailsEditor section={section} update={update} />;
    case 'levels':
      return <LevelsEditor section={section} update={update} />;
  }
}

/* ------------------------------------------------------------ entries */

function EntriesEditor({ section, update }: Props) {
  const labels = entryLabels(section.preset);
  const [open, setOpen] = useState<Set<string>>(() => new Set(section.entries.length === 1 ? [section.entries[0].id] : []));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setField = (id: string, field: keyof Entry, value: string) =>
    update((s) => {
      const e = s.entries.find((x) => x.id === id);
      if (e) (e[field] as string) = value;
    });

  const add = () => {
    const e = newEntry();
    update((s) => void s.entries.push(e));
    setOpen((prev) => new Set(prev).add(e.id));
  };

  return (
    <div className="entries-editor">
      <SortableList
        items={section.entries}
        className="stack-sm"
        onReorder={(items) => update((s) => void (s.entries = items))}
        renderItem={(entry, handle) => {
          const isOpen = open.has(entry.id);
          const summary = entry.title || entry.subtitle || stripHtml(entry.description).slice(0, 60) || 'Untitled entry';
          return (
            <div className={`entry-card${isOpen ? ' is-open' : ''}`}>
              <div className="entry-card-head">
                <DragHandle handle={handle} />
                <button type="button" className="entry-card-toggle" onClick={() => toggle(entry.id)} aria-expanded={isOpen}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span className="entry-card-title">{summary}</span>
                  {entry.date && <span className="entry-card-meta">{entry.date}</span>}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  title="Duplicate entry"
                  aria-label="Duplicate entry"
                  onClick={() =>
                    update((s) => {
                      const i = s.entries.findIndex((x) => x.id === entry.id);
                      s.entries.splice(i + 1, 0, { ...structuredClone(entry), id: uid() });
                    })
                  }
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title="Delete entry"
                  aria-label="Delete entry"
                  onClick={() => update((s) => void (s.entries = s.entries.filter((x) => x.id !== entry.id)))}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {isOpen && (
                <div className="entry-card-body">
                  <div className="grid-2">
                    <Field label={labels.title} value={entry.title} onChange={(v) => setField(entry.id, 'title', v)} wide />
                    <Field label={labels.subtitle} value={entry.subtitle} onChange={(v) => setField(entry.id, 'subtitle', v)} />
                    {labels.location && (
                      <Field label={labels.location} value={entry.location} onChange={(v) => setField(entry.id, 'location', v)} />
                    )}
                    {labels.date && (
                      <Field
                        label={labels.date}
                        value={entry.date}
                        placeholder="e.g. Jan 2024 - Present"
                        onChange={(v) => setField(entry.id, 'date', v)}
                      />
                    )}
                  </div>
                  <div className="field">
                    <span>{labels.description}</span>
                    <RichTextEditor value={entry.description} onChange={(html) => setField(entry.id, 'description', html)} />
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
      <button type="button" className="btn btn--dashed" onClick={add}>
        <Plus size={15} /> Add entry
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ list */

function ListEditor({ section, update }: Props) {
  const refs = useRef(new Map<string, HTMLInputElement>());
  const focusLater = (id: string) => requestAnimationFrame(() => refs.current.get(id)?.focus());

  const insertAfter = (index: number) => {
    const id = uid();
    update((s) => void s.items.splice(index + 1, 0, { id, text: '' }));
    focusLater(id);
  };

  return (
    <div className="rows-editor">
      <SortableList
        items={section.items}
        className="stack-xs"
        onReorder={(items) => update((s) => void (s.items = items))}
        renderItem={(item, handle, index) => (
          <div className="row">
            <DragHandle handle={handle} />
            <input
              className="input"
              ref={(el) => {
                if (el) refs.current.set(item.id, el);
                else refs.current.delete(item.id);
              }}
              value={item.text}
              placeholder="Item"
              onChange={(e) =>
                update((s) => {
                  const it = s.items.find((x) => x.id === item.id);
                  if (it) it.text = e.target.value;
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertAfter(index);
                }
                if (e.key === 'Backspace' && item.text === '' && section.items.length > 1) {
                  e.preventDefault();
                  const prev = section.items[index - 1] ?? section.items[index + 1];
                  update((s) => void (s.items = s.items.filter((x) => x.id !== item.id)));
                  if (prev) focusLater(prev.id);
                }
              }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                const lines = text.split(/\r?\n|[•▪·]\s*/).map((l) => l.trim()).filter(Boolean);
                if (lines.length < 2) return;
                e.preventDefault();
                update((s) => {
                  const i = s.items.findIndex((x) => x.id === item.id);
                  const rest = lines.slice(1).map((t) => ({ id: uid(), text: t }));
                  s.items[i].text = (s.items[i].text + lines[0]).trim();
                  s.items.splice(i + 1, 0, ...rest);
                });
              }}
            />
            <RemoveButton onClick={() => update((s) => void (s.items = s.items.filter((x) => x.id !== item.id)))} />
          </div>
        )}
      />
      <button type="button" className="btn btn--dashed" onClick={() => insertAfter(section.items.length - 1)}>
        <Plus size={15} /> Add item
      </button>
      <p className="hint">Tip: press Enter to add the next item, or paste several lines at once.</p>
    </div>
  );
}

/* ------------------------------------------------------------ details */

function DetailsEditor({ section, update }: Props) {
  return (
    <div className="rows-editor">
      <SortableList
        items={section.details}
        className="stack-xs"
        onReorder={(items) => update((s) => void (s.details = items))}
        renderItem={(d, handle) => (
          <div className="row">
            <DragHandle handle={handle} />
            <input
              className="input input--label"
              value={d.label}
              placeholder="Label"
              onChange={(e) =>
                update((s) => {
                  const it = s.details.find((x) => x.id === d.id);
                  if (it) it.label = e.target.value;
                })
              }
            />
            <input
              className="input"
              value={d.value}
              placeholder="Value"
              onChange={(e) =>
                update((s) => {
                  const it = s.details.find((x) => x.id === d.id);
                  if (it) it.value = e.target.value;
                })
              }
            />
            <RemoveButton onClick={() => update((s) => void (s.details = s.details.filter((x) => x.id !== d.id)))} />
          </div>
        )}
      />
      <button
        type="button"
        className="btn btn--dashed"
        onClick={() => update((s) => void s.details.push({ id: uid(), label: '', value: '' }))}
      >
        <Plus size={15} /> Add row
      </button>
      <p className="hint">Web addresses and e-mails become clickable links in the PDF.</p>
    </div>
  );
}

/* ------------------------------------------------------------ levels */

const LEVEL_NAMES = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Fluent / Expert'];
const levelName = (n: number) => LEVEL_NAMES[Math.min(4, Math.max(0, Math.round(n / 25)))];

function LevelsEditor({ section, update }: Props) {
  return (
    <div className="rows-editor">
      <SortableList
        items={section.levels}
        className="stack-xs"
        onReorder={(items) => update((s) => void (s.levels = items))}
        renderItem={(l, handle) => (
          <div className="row">
            <DragHandle handle={handle} />
            <input
              className="input"
              value={l.name}
              placeholder="e.g. English"
              onChange={(e) =>
                update((s) => {
                  const it = s.levels.find((x) => x.id === l.id);
                  if (it) it.name = e.target.value;
                })
              }
            />
            <input
              type="range"
              className="level-range"
              min={0}
              max={100}
              step={5}
              value={l.level}
              title={`${l.level}% – ${levelName(l.level)}`}
              aria-label={`Level for ${l.name || 'item'}`}
              onChange={(e) =>
                update((s) => {
                  const it = s.levels.find((x) => x.id === l.id);
                  if (it) it.level = Number(e.target.value);
                })
              }
            />
            <span className="level-value">{l.level}%</span>
            <RemoveButton onClick={() => update((s) => void (s.levels = s.levels.filter((x) => x.id !== l.id)))} />
          </div>
        )}
      />
      <button
        type="button"
        className="btn btn--dashed"
        onClick={() => update((s) => void s.levels.push({ id: uid(), name: '', level: 80 }))}
      >
        <Plus size={15} /> Add item
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ bits */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  wide,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  wide?: boolean;
  type?: string;
}) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span>{label}</span>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="icon-btn icon-btn--danger" onClick={onClick} title="Remove" aria-label="Remove">
      <Trash2 size={15} />
    </button>
  );
}
