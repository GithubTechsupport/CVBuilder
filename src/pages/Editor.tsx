import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { produce } from 'immer';
import { ArrowLeft, Check, CloudOff, Download, FileText, Loader2, Palette } from 'lucide-react';
import type { CV } from '../types';
import { api, downloadPdf } from '../lib/api';
import { useToast } from '../components/Toast';
import { ContentPanel, type CVRecipe } from '../editor/ContentPanel';
import { DesignPanel } from '../editor/DesignPanel';
import { PreviewPane } from '../editor/PreviewPane';

type SaveState = 'saved' | 'pending' | 'saving' | 'error';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [cv, setCv] = useState<CV | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'content' | 'design'>('content');
  const [active, setActive] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [exporting, setExporting] = useState(false);

  const latest = useRef<CV | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!id) return;
    api.get(id).then(
      (data) => {
        latest.current = data;
        setCv(data);
      },
      (err) => setLoadError(err.message),
    );
  }, [id]);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    await inFlight.current;
    if (!dirty.current || !latest.current) return;
    dirty.current = false;
    setSaveState('saving');
    const snapshot = latest.current;
    inFlight.current = api.save(snapshot).then(
      () => setSaveState(dirty.current ? 'pending' : 'saved'),
      (err) => {
        dirty.current = true;
        setSaveState('error');
        console.error(err);
      },
    );
    await inFlight.current;
  }, []);

  const update = useCallback(
    (recipe: CVRecipe) => {
      setCv((prev) => {
        if (!prev) return prev;
        const next = produce(prev, recipe);
        latest.current = next;
        return next;
      });
      dirty.current = true;
      setSaveState('pending');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 700);
    },
    [flush],
  );

  // Warn before closing the tab with unsaved changes; save when leaving the editor.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        void flush();
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      void flush();
    };
  }, [flush]);

  // Ctrl/Cmd+S saves immediately.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        dirty.current = true;
        void flush().then(() => toast('Saved', 'success'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, toast]);

  const onDownload = async () => {
    if (!latest.current) return;
    setExporting(true);
    try {
      await flush();
      const how = await downloadPdf(latest.current);
      toast(how === 'server' ? 'PDF downloaded' : 'Opened print view — choose “Save as PDF”', how === 'server' ? 'success' : 'info');
    } finally {
      setExporting(false);
    }
  };

  const selectFromPreview = useCallback((sectionId: string) => {
    setTab('content');
    setActive(sectionId);
  }, []);

  if (loadError) {
    return (
      <div className="center-message">
        <h2>Could not open this CV</h2>
        <p className="muted">{loadError}</p>
        <Link className="btn btn--primary" to="/">
          Back to dashboard
        </Link>
      </div>
    );
  }
  if (!cv) {
    return (
      <div className="center-message">
        <Loader2 className="spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="editor">
      <header className="topbar">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={async () => {
            await flush();
            navigate('/');
          }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <input
          className="doc-name"
          value={cv.name}
          aria-label="CV name"
          onChange={(e) => update((d) => void (d.name = e.target.value))}
          onBlur={() => !cv.name.trim() && update((d) => void (d.name = 'Untitled CV'))}
        />
        <SaveIndicator state={saveState} onRetry={() => void flush()} />
        <div className="topbar-spacer" />
        <button type="button" className="btn btn--primary" onClick={onDownload} disabled={exporting}>
          {exporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />} Download PDF
        </button>
      </header>

      <div className="editor-body">
        <aside className="panel">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'is-selected' : ''} onClick={() => setTab('content')}>
              <FileText size={15} /> Content
            </button>
            <button role="tab" aria-selected={tab === 'design'} className={tab === 'design' ? 'is-selected' : ''} onClick={() => setTab('design')}>
              <Palette size={15} /> Template &amp; style
            </button>
          </div>
          <div className="panel-scroll">
            {tab === 'content' ? (
              <ContentPanel cv={cv} update={update} active={active} setActive={setActive} />
            ) : (
              <DesignPanel cv={cv} update={update} />
            )}
          </div>
        </aside>
        <PreviewPane cv={cv} active={active} onSelect={selectFromPreview} />
      </div>
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'error')
    return (
      <button type="button" className="save-state save-state--error" onClick={onRetry}>
        <CloudOff size={14} /> Not saved — retry
      </button>
    );
  if (state === 'saved')
    return (
      <span className="save-state">
        <Check size={14} /> Saved
      </span>
    );
  return (
    <span className="save-state">
      <Loader2 size={14} className="spin" /> Saving…
    </span>
  );
}
