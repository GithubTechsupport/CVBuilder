import { useState } from 'react';
import type { Column, PresetId, SectionKind } from '../types';
import { KIND_INFO, PRESETS } from '../lib/catalog';
import { Modal } from '../components/Modal';

interface Props {
  column: Column;
  hasSidebar: boolean;
  existing: PresetId[];
  onAdd: (opts: { preset?: PresetId; kind?: SectionKind; title?: string; column: Column }) => void;
  onClose: () => void;
}

export function AddSectionDialog({ column, hasSidebar, existing, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<SectionKind>('entries');
  const where = hasSidebar ? (column === 'sidebar' ? ' to sidebar' : ' to main column') : '';

  return (
    <Modal title={`Add section${where}`} onClose={onClose} width={680}>
      <h3 className="modal-subhead">Ready-made sections</h3>
      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="preset-card"
            onClick={() => {
              onAdd({ preset: p.id, column });
              onClose();
            }}
          >
            <strong>
              {p.title}
              {existing.includes(p.id) && <span className="tag tag--muted">added</span>}
            </strong>
            <span>{p.hint}</span>
          </button>
        ))}
      </div>

      <h3 className="modal-subhead">Custom section</h3>
      <form
        className="custom-section-form"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({ kind, title: title.trim() || 'Custom section', column });
          onClose();
        }}
      >
        <label className="field">
          <span>Title</span>
          <input
            className="input"
            value={title}
            placeholder="e.g. Publications, Courses, Hobbies"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="field">
          <span>Content type</span>
          <div className="kind-grid">
            {(Object.keys(KIND_INFO) as SectionKind[]).map((k) => (
              <label key={k} className={`kind-option${kind === k ? ' is-selected' : ''}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                <strong>{KIND_INFO[k].name}</strong>
                <span>{KIND_INFO[k].hint}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn--primary">
            Add custom section
          </button>
        </div>
      </form>
    </Modal>
  );
}
