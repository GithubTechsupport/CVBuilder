export type TemplateId = 'monochrome' | 'modern' | 'classic' | 'swiss';

export type SectionKind = 'text' | 'entries' | 'list' | 'details' | 'levels';

export type Column = 'main' | 'sidebar';

export type PresetId =
  | 'about'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'technologies'
  | 'languages'
  | 'personal'
  | 'links'
  | 'references'
  | 'certifications'
  | 'awards'
  | 'volunteering'
  | 'interests'
  | 'custom';

export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  /** Rich text (HTML) */
  description: string;
}

export interface ListItem {
  id: string;
  text: string;
}

export interface DetailItem {
  id: string;
  label: string;
  value: string;
}

export interface LevelItem {
  id: string;
  name: string;
  /** 0–100 */
  level: number;
}

export type ListStyle = 'stacked' | 'bullets' | 'tags' | 'inline';
export type LevelStyle = 'bar' | 'dots' | 'none';

export interface Section {
  id: string;
  kind: SectionKind;
  preset: PresetId;
  title: string;
  column: Column;
  hidden: boolean;
  /** Decorative vertical rule beside the section body (sidebar templates). */
  accentLine: boolean;
  /** Rich text (HTML), for kind "text" */
  content: string;
  entries: Entry[];
  items: ListItem[];
  details: DetailItem[];
  levels: LevelItem[];
  listStyle: ListStyle;
  levelStyle: LevelStyle;
  /** Text size of the section body relative to the CV font size (1 = 100%) */
  fontScale: number;
}

export interface Profile {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  /** Cropped headshot as a data URL */
  photo: string | null;
}

export type PageFormat = 'continuous' | 'a4' | 'letter';
export type PhotoShape = 'square' | 'rounded' | 'circle';

export interface CVStyle {
  palette: string;
  accent: string;
  sidebarBg: string;
  sidebarText: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  /** Base font size in px */
  fontSize: number;
  lineHeight: number;
  /** Multiplier for vertical spacing between sections/entries */
  spacing: number;
  pageFormat: PageFormat;
  showPhoto: boolean;
  photoShape: PhotoShape;
  /** Sidebar width in percent of the page */
  sidebarWidth: number;
}

export interface CV {
  id: string;
  name: string;
  template: TemplateId;
  style: CVStyle;
  profile: Profile;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}
