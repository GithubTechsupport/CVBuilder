import { useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, UserRound } from 'lucide-react';
import type { CV, Profile } from '../types';
import { Field } from './SectionBodyEditor';
import { PhotoField } from './PhotoField';

interface Props {
  cv: CV;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  setProfile: (recipe: (p: Profile) => void) => void;
  setShowPhoto: (show: boolean) => void;
}

export function ProfileCard({ cv, open, active, onToggle, setProfile, setShowPhoto }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const p = cv.profile;
  const set = (key: keyof Profile) => (v: string) => setProfile((d) => void ((d[key] as string) = v));

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [active]);

  return (
    <div ref={ref} className={`section-card section-card--profile${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}>
      <div className="section-card-head">
        <span className="drag-handle drag-handle--static">
          <UserRound size={16} />
        </span>
        <button type="button" className="section-card-toggle" onClick={onToggle} aria-expanded={open}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="section-card-title">Header &amp; photo</span>
          <span className="tag">Name, title, contact</span>
        </button>
      </div>
      {open && (
        <div className="section-card-body">
          <PhotoField value={p.photo} shape={cv.style.photoShape} onChange={(photo) => setProfile((d) => void (d.photo = photo))} />
          {p.photo && (
            <label className="check">
              <input type="checkbox" checked={cv.style.showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} />
              Show photo on CV
            </label>
          )}
          <div className="grid-2">
            <Field label="First name" value={p.firstName} onChange={set('firstName')} />
            <Field label="Last name" value={p.lastName} onChange={set('lastName')} />
            <Field
              label="Job title / headline"
              value={p.headline}
              onChange={set('headline')}
              placeholder="e.g. Software Developer"
              wide
            />
            <Field label="E-mail" type="email" value={p.email} onChange={set('email')} />
            <Field label="Phone" value={p.phone} onChange={set('phone')} />
            <Field label="Location" value={p.location} onChange={set('location')} placeholder="City, Country" />
            <Field label="Website" value={p.website} onChange={set('website')} placeholder="yoursite.com" />
          </div>
          <p className="hint">
            Contact fields filled in here appear in the CV header. Leave them empty if you list them in a separate section instead.
          </p>
        </div>
      )}
    </div>
  );
}
