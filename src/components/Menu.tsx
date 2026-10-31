import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

export function Menu({ items, label = 'More actions', trigger }: { items: MenuItem[]; label?: string; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger ?? <MoreVertical size={16} />}
      </button>
      {open && (
        <div className="menu-list" role="menu">
          {items
            .filter((i) => !i.hidden)
            .map((i) => (
              <button
                key={i.label}
                type="button"
                role="menuitem"
                className={`menu-item${i.danger ? ' is-danger' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  i.onSelect();
                }}
              >
                {i.icon}
                {i.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
