import type { Column, CVStyle, ListStyle, PresetId, SectionKind, TemplateId } from '../types';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  hasSidebar: boolean;
  /** Style applied when switching to this template */
  defaults: Partial<CVStyle>;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Dark sidebar with full-bleed photo. Based on CVEng.pdf.',
    hasSidebar: true,
    defaults: {
      palette: 'charcoal',
      accent: '#1a1a19',
      sidebarBg: '#1a1a19',
      sidebarText: '#ffffff',
      textColor: '#111111',
      headingFont: 'Lato',
      bodyFont: 'Lato',
      fontSize: 13,
      lineHeight: 1.54,
      photoShape: 'square',
      sidebarWidth: 35,
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Colored header band, light sidebar on the right.',
    hasSidebar: true,
    defaults: {
      palette: 'navy',
      accent: '#1f4e79',
      sidebarBg: '#eef3f8',
      sidebarText: '#1d2733',
      textColor: '#1d2733',
      headingFont: 'Montserrat',
      bodyFont: 'Open Sans',
      fontSize: 12,
      lineHeight: 1.5,
      photoShape: 'circle',
      sidebarWidth: 33,
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Single column, centered serif header. Traditional and ATS-friendly.',
    hasSidebar: false,
    defaults: {
      palette: 'ink',
      accent: '#222222',
      sidebarBg: '#f3f3f3',
      sidebarText: '#222222',
      textColor: '#222222',
      headingFont: 'EB Garamond',
      bodyFont: 'EB Garamond',
      fontSize: 14,
      lineHeight: 1.4,
      photoShape: 'circle',
    },
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Single column with headings in a left gutter. Clean and minimal.',
    hasSidebar: false,
    defaults: {
      palette: 'crimson',
      accent: '#c0392b',
      sidebarBg: '#f5f5f5',
      sidebarText: '#1b1b1b',
      textColor: '#1b1b1b',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontSize: 12,
      lineHeight: 1.5,
      photoShape: 'rounded',
    },
  },
];

export const templateMeta = (id: TemplateId) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export interface Palette {
  id: string;
  name: string;
  accent: string;
  sidebarBg: string;
  sidebarText: string;
  textColor: string;
}

/** Colour presets. For light-sidebar templates the sidebar colour is tinted automatically. */
export const PALETTES: Palette[] = [
  { id: 'charcoal', name: 'Charcoal', accent: '#1a1a19', sidebarBg: '#1a1a19', sidebarText: '#ffffff', textColor: '#111111' },
  { id: 'ink', name: 'Ink', accent: '#222222', sidebarBg: '#f3f3f3', sidebarText: '#222222', textColor: '#222222' },
  { id: 'navy', name: 'Navy', accent: '#1f4e79', sidebarBg: '#16324f', sidebarText: '#ffffff', textColor: '#1d2733' },
  { id: 'forest', name: 'Forest', accent: '#2f6b4f', sidebarBg: '#1f3d30', sidebarText: '#f2f7f4', textColor: '#1c2621' },
  { id: 'burgundy', name: 'Burgundy', accent: '#7b2d3b', sidebarBg: '#4a1d26', sidebarText: '#fbf3f4', textColor: '#241a1c' },
  { id: 'teal', name: 'Teal', accent: '#0f7c80', sidebarBg: '#0e4f52', sidebarText: '#f0fafa', textColor: '#15282a' },
  { id: 'plum', name: 'Plum', accent: '#5b3a7a', sidebarBg: '#35214a', sidebarText: '#f7f2fb', textColor: '#211a28' },
  { id: 'slate', name: 'Slate', accent: '#475569', sidebarBg: '#334155', sidebarText: '#f8fafc', textColor: '#1e293b' },
  { id: 'crimson', name: 'Crimson', accent: '#c0392b', sidebarBg: '#2b2b2b', sidebarText: '#ffffff', textColor: '#1b1b1b' },
  { id: 'sand', name: 'Sand', accent: '#9a6b3f', sidebarBg: '#efe6da', sidebarText: '#3b2f25', textColor: '#2e261f' },
];

export const FONTS: { family: string; category: 'sans' | 'serif' }[] = [
  { family: 'Lato', category: 'sans' },
  { family: 'Inter', category: 'sans' },
  { family: 'Open Sans', category: 'sans' },
  { family: 'Montserrat', category: 'sans' },
  { family: 'Raleway', category: 'sans' },
  { family: 'Source Sans 3', category: 'sans' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'EB Garamond', category: 'serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Roboto Slab', category: 'serif' },
];

export const fontStack = (family: string) => {
  const cat = FONTS.find((f) => f.family === family)?.category ?? 'sans';
  return `'${family}', ${cat === 'serif' ? 'Georgia, serif' : 'Helvetica, Arial, sans-serif'}`;
};

export interface EntryLabels {
  title: string;
  subtitle: string;
  location: string | null;
  date: string | null;
  description: string;
}

export interface PresetMeta {
  id: PresetId;
  kind: SectionKind;
  title: string;
  column: Column;
  accentLine?: boolean;
  listStyle?: ListStyle;
  hint: string;
  labels?: EntryLabels;
}

const defaultLabels: EntryLabels = {
  title: 'Title',
  subtitle: 'Subtitle',
  location: 'Location',
  date: 'Date',
  description: 'Description',
};

export const PRESETS: PresetMeta[] = [
  { id: 'about', kind: 'text', title: 'About me', column: 'main', hint: 'Short professional summary' },
  {
    id: 'education',
    kind: 'entries',
    title: 'Education',
    column: 'main',
    hint: 'Degrees, schools and courses',
    labels: { title: 'Degree / programme', subtitle: 'School', location: 'Location', date: 'Year or period', description: 'Details' },
  },
  {
    id: 'experience',
    kind: 'entries',
    title: 'Work Experience',
    column: 'main',
    hint: 'Jobs, internships and positions',
    labels: { title: 'Position', subtitle: 'Company', location: 'Location', date: 'Period', description: 'Description' },
  },
  {
    id: 'projects',
    kind: 'entries',
    title: 'Projects',
    column: 'main',
    hint: 'Personal, academic or work projects',
    labels: { title: 'Project name', subtitle: 'Organisation / context', location: 'Location', date: 'Period', description: 'Description' },
  },
  { id: 'skills', kind: 'list', title: 'Skills', column: 'sidebar', accentLine: true, hint: 'A list of skills' },
  { id: 'technologies', kind: 'text', title: 'Technologies', column: 'sidebar', hint: 'Tools, languages and frameworks' },
  { id: 'languages', kind: 'levels', title: 'Languages', column: 'sidebar', accentLine: true, hint: 'Languages with proficiency' },
  { id: 'personal', kind: 'details', title: 'Personal Information', column: 'sidebar', hint: 'Date of birth, phone, address…' },
  { id: 'links', kind: 'details', title: 'Links', column: 'sidebar', accentLine: true, hint: 'LinkedIn, GitHub, portfolio' },
  {
    id: 'references',
    kind: 'entries',
    title: 'References',
    column: 'sidebar',
    accentLine: true,
    hint: 'People who can vouch for you',
    labels: { title: 'Name', subtitle: 'Role & company', location: null, date: null, description: 'Contact details' },
  },
  {
    id: 'certifications',
    kind: 'entries',
    title: 'Certifications',
    column: 'main',
    hint: 'Certificates and licences',
    labels: { title: 'Certificate', subtitle: 'Issuer', location: null, date: 'Date', description: 'Details' },
  },
  {
    id: 'awards',
    kind: 'entries',
    title: 'Awards',
    column: 'main',
    hint: 'Honours and achievements',
    labels: { title: 'Award', subtitle: 'Awarded by', location: null, date: 'Date', description: 'Details' },
  },
  {
    id: 'volunteering',
    kind: 'entries',
    title: 'Volunteering',
    column: 'main',
    hint: 'Voluntary work and organisations',
    labels: { title: 'Role', subtitle: 'Organisation', location: 'Location', date: 'Period', description: 'Description' },
  },
  { id: 'interests', kind: 'list', title: 'Interests', column: 'sidebar', accentLine: true, hint: 'Hobbies and interests' },
];

export const presetMeta = (id: PresetId) => PRESETS.find((p) => p.id === id);

export const entryLabels = (preset: PresetId): EntryLabels => presetMeta(preset)?.labels ?? defaultLabels;

export const KIND_INFO: Record<SectionKind, { name: string; hint: string }> = {
  text: { name: 'Text', hint: 'A block of formatted text' },
  entries: { name: 'Entries', hint: 'Items with title, subtitle, date and description' },
  list: { name: 'List', hint: 'Simple list of short items' },
  details: { name: 'Label & value', hint: 'Pairs like “Phone: 123 45 678”' },
  levels: { name: 'Skill levels', hint: 'Items with a proficiency bar' },
};
