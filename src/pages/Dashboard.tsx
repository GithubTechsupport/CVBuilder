import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Download, FileJson, FilePlus2, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { CV, TemplateId } from '../types';
import { api, downloadBlob, downloadPdf } from '../lib/api';
import { cloneCV, newCV, normalizeCV, uid } from '../lib/factory';
import { TEMPLATES, templateMeta } from '../lib/catalog';
import { withTemplate } from '../lib/style';
import { CVThumb } from '../components/CVThumb';
import { Menu } from '../components/Menu';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [cvs, setCvs] = useState<CV[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = () =>
    api.list().then(
      (list) => {
        setCvs(list);
        setError(null);
      },
      (err) => setError(err.message),
    );

  useEffect(() => {
    void load();
  }, []);

  const createAndOpen = async (cv: CV) => {
    await api.save(cv);
    navigate(`/edit/${cv.id}`);
  };

  const duplicate = async (cv: CV) => {
    const copy = cloneCV(cv);
    await api.save(copy);
    toast(`Duplicated “${cv.name}”`, 'success');
    void load();
  };

  const remove = async (cv: CV) => {
    if (!window.confirm(`Delete “${cv.name}”? This cannot be undone.`)) return;
    await api.remove(cv.id);
    toast('CV deleted');
    void load();
  };

  const rename = async (cv: CV) => {
    const name = window.prompt('Rename CV', cv.name)?.trim();
    if (!name || name === cv.name) return;
    await api.save({ ...cv, name });
    void load();
  };

  const exportJson = (cv: CV) => {
    const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${cv.name.replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || 'cv'}.json`);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const cv = normalizeCV({ ...raw, id: uid() });
      cv.name = cv.name ? `${cv.name} (imported)` : 'Imported CV';
      await api.save(cv);
      toast('CV imported', 'success');
      void load();
    } catch (err) {
      toast(`Could not import: ${(err as Error).message}`, 'error');
    }
  };

  const pdf = async (cv: CV) => {
    setBusy(cv.id);
    try {
      const how = await downloadPdf(cv);
      toast(how === 'server' ? 'PDF downloaded' : 'Opened print view — choose “Save as PDF”', how === 'server' ? 'success' : 'info');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-head">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          CV Builder
        </div>
        <div className="dash-actions">
          <button type="button" className="btn" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> New CV
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void importJson(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <main className="dash-main">
        <h1>Your CVs</h1>
        {error && (
          <div className="alert">
            Could not reach the CV server ({error}). Make sure it is running with <code>npm run dev</code>.
            <button className="btn btn--sm" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}
        {!cvs && !error && (
          <p className="muted">
            <Loader2 size={16} className="spin" /> Loading…
          </p>
        )}
        {cvs && (
          <div className="cv-grid">
            <button type="button" className="cv-card cv-card--new" onClick={() => setCreating(true)}>
              <FilePlus2 size={30} strokeWidth={1.5} />
              <span>Create new CV</span>
            </button>
            {cvs.map((cv) => (
              <article key={cv.id} className="cv-card">
                {/* Not a <Link>: the CV itself contains links, and <a> can't be nested. */}
                <div
                  className="cv-card-thumb"
                  role="link"
                  tabIndex={0}
                  aria-label={`Edit ${cv.name}`}
                  onClick={() => navigate(`/edit/${cv.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/edit/${cv.id}`)}
                >
                  <CVThumb cv={cv} width={236} />
                </div>
                <div className="cv-card-info">
                  <div className="cv-card-text">
                    <Link to={`/edit/${cv.id}`} className="cv-card-name">
                      {cv.name}
                    </Link>
                    <span className="muted">
                      {templateMeta(cv.template).name} · edited {timeAgo(cv.updatedAt)}
                    </span>
                  </div>
                  {busy === cv.id ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Menu
                      items={[
                        { label: 'Edit', icon: <Pencil size={15} />, onSelect: () => navigate(`/edit/${cv.id}`) },
                        { label: 'Download PDF', icon: <Download size={15} />, onSelect: () => void pdf(cv) },
                        { label: 'Rename', icon: <Pencil size={15} />, onSelect: () => void rename(cv) },
                        { label: 'Duplicate', icon: <Copy size={15} />, onSelect: () => void duplicate(cv) },
                        { label: 'Export JSON', icon: <FileJson size={15} />, onSelect: () => exportJson(cv) },
                        { label: 'Delete', icon: <Trash2 size={15} />, danger: true, onSelect: () => void remove(cv) },
                      ]}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {creating && <NewCVDialog onClose={() => setCreating(false)} onCreate={createAndOpen} />}
    </div>
  );
}

function NewCVDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (cv: CV) => Promise<void> }) {
  const [template, setTemplate] = useState<TemplateId>('monochrome');
  const [start, setStart] = useState<'blank' | 'example'>('blank');
  const [name, setName] = useState('');
  const [example, setExample] = useState<CV | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.example().then(setExample, () => {});
  }, []);

  const previews = useMemo(() => (example ? TEMPLATES.map((t) => ({ t, cv: withTemplate(example, t.id) })) : []), [example]);

  const create = async () => {
    setSaving(true);
    try {
      let cv: CV;
      if (start === 'example' && example) {
        cv = withTemplate({ ...structuredClone(example), id: uid() }, template);
      } else {
        cv = newCV(template);
      }
      cv.name = name.trim() || (start === 'example' ? 'CV (from example)' : 'Untitled CV');
      await onCreate(cv);
    } catch (err) {
      toast(`Could not create CV: ${(err as Error).message}`, 'error');
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create a new CV"
      onClose={onClose}
      width={760}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={create} disabled={saving}>
            {saving && <Loader2 size={16} className="spin" />} Create CV
          </button>
        </>
      }
    >
      <label className="field">
        <span>Name (only shown on your dashboard)</span>
        <input className="input" autoFocus value={name} placeholder="e.g. CV – Frontend roles" onChange={(e) => setName(e.target.value)} />
      </label>

      <h3 className="modal-subhead">Template</h3>
      <div className="template-grid template-grid--4">
        {TEMPLATES.map((t) => {
          const preview = previews.find((p) => p.t.id === t.id)?.cv;
          return (
            <button
              key={t.id}
              type="button"
              className={`template-card${template === t.id ? ' is-selected' : ''}`}
              onClick={() => setTemplate(t.id)}
              aria-pressed={template === t.id}
            >
              {preview ? <CVThumb cv={preview} width={150} /> : <div className="cv-thumb cv-thumb--loading" />}
              <span className="template-card-name">{t.name}</span>
              <span className="template-card-desc">{t.description}</span>
            </button>
          );
        })}
      </div>

      <h3 className="modal-subhead">Start from</h3>
      <div className="segmented segmented--wide" role="radiogroup">
        <button type="button" role="radio" aria-checked={start === 'blank'} className={start === 'blank' ? 'is-selected' : ''} onClick={() => setStart('blank')}>
          Blank CV with standard sections
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={start === 'example'}
          className={start === 'example' ? 'is-selected' : ''}
          onClick={() => setStart('example')}
          disabled={!example}
        >
          Copy of the example CV
        </button>
      </div>
    </Modal>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
}
