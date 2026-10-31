import type { CV, CVStyle, TemplateId } from '../types';
import { PALETTES, templateMeta, type Palette } from './catalog';

/** Templates whose sidebar is a light tint of the accent rather than a solid dark panel. */
const LIGHT_SIDEBAR: TemplateId[] = ['modern'];

function mix(hexA: string, hexB: string, weightA: number): string {
  const parse = (h: string) => {
    const v = h.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const a = parse(hexA);
  const b = parse(hexB);
  return `#${a
    .map((x, i) => Math.round(x * weightA + b[i] * (1 - weightA)))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function paletteColors(palette: Palette, template: TemplateId): Partial<CVStyle> {
  if (LIGHT_SIDEBAR.includes(template)) {
    return {
      palette: palette.id,
      accent: palette.accent,
      textColor: palette.textColor,
      sidebarBg: mix(palette.accent, '#ffffff', 0.08),
      sidebarText: palette.textColor,
    };
  }
  return {
    palette: palette.id,
    accent: palette.accent,
    sidebarBg: palette.sidebarBg,
    sidebarText: palette.sidebarText,
    textColor: palette.textColor,
  };
}

/** Switch template, adopting its typography/colour defaults but keeping layout choices. */
export function withTemplate(cv: CV, template: TemplateId): CV {
  const defaults = templateMeta(template).defaults;
  const style: CVStyle = {
    ...cv.style,
    ...defaults,
    pageFormat: cv.style.pageFormat,
    showPhoto: cv.style.showPhoto,
    spacing: cv.style.spacing,
  };
  let sections = cv.sections;
  // Going from a sidebar layout to a single column: put main-column content first so the CV
  // doesn't open with sidebar details. Relative order within each column is kept, so switching
  // back to a sidebar template restores the same layout.
  if (templateMeta(cv.template).hasSidebar && !templateMeta(template).hasSidebar) {
    sections = [...cv.sections.filter((s) => s.column === 'main'), ...cv.sections.filter((s) => s.column !== 'main')];
  }
  return { ...cv, template, style, sections };
}

export function applyPalette(style: CVStyle, paletteId: string, template: TemplateId): CVStyle {
  const palette = PALETTES.find((p) => p.id === paletteId);
  return palette ? { ...style, ...paletteColors(palette, template) } : style;
}
