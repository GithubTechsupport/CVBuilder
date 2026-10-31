import { useState, type ReactNode } from 'react';
import { PanelLeft, Plus, Rows3 } from 'lucide-react';
import type { Column, CV, PresetId, Section, SectionKind } from '../types';
import { templateMeta } from '../lib/catalog';
import { newSection, uid } from '../lib/factory';
import { SortableList } from '../components/Sortable';
import { SectionCard } from './SectionCard';
import { ProfileCard } from './ProfileCard';
import { AddSectionDialog } from './AddSectionDialog';

export type CVRecipe = (draft: CV) => void;

interface Props {
  cv: CV;
  update: (recipe: CVRecipe) => void;
  /** 'header' or a section id, set by clicking in the preview */
  active: string | null;
  setActive: (id: string | null) => void;
}

export function ContentPanel({ cv, update, active, setActive }: Props) {
  const hasSidebar = templateMeta(cv.template).hasSidebar;
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(['header']));
  const [adding, setAdding] = useState<Column | null>(null);

  const isOpen = (id: string) => openIds.has(id) || active === id;
  const toggle = (id: string) => {
    const open = isOpen(id);
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.delete(id);
      else next.add(id);
      return next;
    });
    if (open && active === id) setActive(null);
  };

  const updateSection = (id: string) => (recipe: (s: Section) => void) =>
    update((d) => {
      const s = d.sections.find((x) => x.id === id);
      if (s) recipe(s);
    });

  /** Reorder within a subset (e.g. only the sidebar sections) while keeping the others in place. */
  const reorderSubset = (subset: Section[]) =>
    update((d) => {
      const ids = new Set(subset.map((s) => s.id));
      const byId = new Map(d.sections.map((s) => [s.id, s]));
      let k = 0;
      d.sections = d.sections.map((s) => (ids.has(s.id) ? byId.get(subset[k++].id)! : s));
    });

  const addSection = (opts: { preset?: PresetId; kind?: SectionKind; title?: string; column: Column }) => {
    const s = newSection(opts);
    if (hasSidebar) s.column = opts.column;
    update((d) => void d.sections.push(s));
    setOpenIds((prev) => new Set(prev).add(s.id));
    setActive(s.id);
  };

  const duplicate = (section: Section) =>
    update((d) => {
      const i = d.sections.findIndex((x) => x.id === section.id);
      const copy = structuredClone(section);
      copy.id = uid();
      copy.title = `${section.title} (copy)`;
      for (const list of [copy.entries, copy.items, copy.details, copy.levels]) for (const x of list) x.id = uid();
      d.sections.splice(i + 1, 0, copy);
    });

  const remove = (section: Section) => {
    if (!window.confirm(`Delete the section “${section.title || 'Untitled'}”? This cannot be undone.`)) return;
    update((d) => void (d.sections = d.sections.filter((x) => x.id !== section.id)));
  };

  const renderList = (sections: Section[]) => (
    <SortableList
      items={sections}
      className="stack"
      onReorder={reorderSubset}
      renderItem={(section, handle) => (
        <SectionCard
          section={section}
          handle={handle}
          open={isOpen(section.id)}
          active={active === section.id}
          hasSidebar={hasSidebar}
          onToggle={() => toggle(section.id)}
          update={updateSection(section.id)}
          onDuplicate={() => duplicate(section)}
          onDelete={() => remove(section)}
        />
      )}
    />
  );

  const sidebar = cv.sections.filter((s) => s.column === 'sidebar');
  const main = cv.sections.filter((s) => s.column === 'main');

  return (
    <div className="content-panel">
      <ProfileCard
        cv={cv}
        open={isOpen('header')}
        active={active === 'header'}
        onToggle={() => toggle('header')}
        setProfile={(recipe) => update((d) => recipe(d.profile))}
        setShowPhoto={(show) => update((d) => void (d.style.showPhoto = show))}
      />

      {hasSidebar ? (
        <>
          <GroupHeader icon={<PanelLeft size={15} />} title="Sidebar" count={sidebar.length} onAdd={() => setAdding('sidebar')} />
          {sidebar.length ? renderList(sidebar) : <EmptyGroup onAdd={() => setAdding('sidebar')} />}
          <GroupHeader icon={<Rows3 size={15} />} title="Main column" count={main.length} onAdd={() => setAdding('main')} />
          {main.length ? renderList(main) : <EmptyGroup onAdd={() => setAdding('main')} />}
        </>
      ) : (
        <>
          <GroupHeader icon={<Rows3 size={15} />} title="Sections" count={cv.sections.length} onAdd={() => setAdding('main')} />
          {cv.sections.length ? renderList(cv.sections) : <EmptyGroup onAdd={() => setAdding('main')} />}
        </>
      )}

      {adding && (
        <AddSectionDialog
          column={adding}
          hasSidebar={hasSidebar}
          existing={cv.sections.map((s) => s.preset)}
          onAdd={addSection}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}

function GroupHeader({ icon, title, count, onAdd }: { icon: ReactNode; title: string; count: number; onAdd: () => void }) {
  return (
    <div className="group-head">
      <h3>
        {icon} {title} <span className="count">{count}</span>
      </h3>
      <button type="button" className="btn btn--sm btn--ghost" onClick={onAdd}>
        <Plus size={14} /> Add section
      </button>
    </div>
  );
}

function EmptyGroup({ onAdd }: { onAdd: () => void }) {
  return (
    <button type="button" className="empty-group" onClick={onAdd}>
      No sections here yet. Click to add one.
    </button>
  );
}
