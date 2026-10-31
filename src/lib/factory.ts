import type { Column, CV, CVStyle, Entry, PresetId, Section, SectionKind, TemplateId } from '../types';
import { presetMeta, TEMPLATES, templateMeta } from './catalog';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const BASE_STYLE: CVStyle = {
  palette: 'charcoal',
  accent: '#1a1a19',
  sidebarBg: '#1a1a19',
  sidebarText: '#ffffff',
  textColor: '#111111',
  headingFont: 'Lato',
  bodyFont: 'Lato',
  fontSize: 13,
  lineHeight: 1.54,
  spacing: 1,
  pageFormat: 'continuous',
  showPhoto: true,
  photoShape: 'square',
  sidebarWidth: 35,
};

export function newEntry(partial: Partial<Entry> = {}): Entry {
  return { id: uid(), title: '', subtitle: '', location: '', date: '', description: '', ...partial };
}

export function newSection(opts: { preset?: PresetId; kind?: SectionKind; title?: string; column?: Column }): Section {
  const meta = opts.preset && opts.preset !== 'custom' ? presetMeta(opts.preset) : undefined;
  const kind = meta?.kind ?? opts.kind ?? 'text';
  const section: Section = {
    id: uid(),
    kind,
    preset: meta?.id ?? 'custom',
    title: opts.title ?? meta?.title ?? 'New section',
    column: opts.column ?? meta?.column ?? 'main',
    hidden: false,
    accentLine: meta?.accentLine ?? (kind === 'list' || kind === 'levels'),
    content: '',
    entries: [],
    items: [],
    details: [],
    levels: [],
    listStyle: meta?.listStyle ?? 'stacked',
    levelStyle: 'bar',
    fontScale: 1,
  };
  // Start each section with one empty row so there is something to type into.
  if (kind === 'entries') section.entries.push(newEntry());
  if (kind === 'list') section.items.push({ id: uid(), text: '' });
  if (kind === 'details') section.details.push({ id: uid(), label: '', value: '' });
  if (kind === 'levels') section.levels.push({ id: uid(), name: '', level: 80 });
  return section;
}

export function newCV(template: TemplateId = 'monochrome', name = 'Untitled CV'): CV {
  const now = new Date().toISOString();
  const style: CVStyle = { ...BASE_STYLE, ...templateMeta(template).defaults };
  return {
    id: uid(),
    name,
    template,
    style,
    profile: { firstName: '', lastName: '', headline: '', email: '', phone: '', location: '', website: '', photo: null },
    sections: [
      newSection({ preset: 'personal' }),
      newSection({ preset: 'skills' }),
      newSection({ preset: 'languages' }),
      newSection({ preset: 'about' }),
      newSection({ preset: 'education' }),
      newSection({ preset: 'experience' }),
      newSection({ preset: 'projects' }),
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/** Fill in any missing fields, e.g. for imported or older CV files. */
export function normalizeCV(raw: Partial<CV> & { id?: string }): CV {
  const base = newCV((raw.template && TEMPLATES.some((t) => t.id === raw.template) ? raw.template : 'monochrome') as TemplateId);
  const sections = Array.isArray(raw.sections)
    ? (raw.sections as Partial<Section>[]).map((s) => {
        const blank: Section = { ...newSection({ kind: s.kind, preset: s.preset }), entries: [], items: [], details: [], levels: [] };
        return { ...blank, ...s, id: s.id || uid() } as Section;
      })
    : base.sections;
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    style: { ...base.style, ...(raw.style ?? {}) },
    profile: { ...base.profile, ...(raw.profile ?? {}) },
    sections,
  } as CV;
}

/** Deep copy with fresh ids, for "Duplicate". */
export function cloneCV(cv: CV, name?: string): CV {
  const now = new Date().toISOString();
  const copy: CV = structuredClone(cv);
  copy.id = uid();
  copy.name = name ?? `${cv.name} (copy)`;
  copy.createdAt = now;
  copy.updatedAt = now;
  return copy;
}
