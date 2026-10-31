import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Crop, ImagePlus, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface Props {
  value: string | null;
  shape: 'square' | 'rounded' | 'circle';
  onChange: (dataUrl: string | null) => void;
}

const OUTPUT_SIZE = 600;

async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function PhotoField({ value, shape, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP…).');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setSource(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const save = async () => {
    if (!source || !area) return;
    onChange(await cropToDataUrl(source, area));
    setSource(null);
  };

  return (
    <div className="photo-field">
      <div className={`photo-preview photo-preview--${shape}`}>
        {value ? <img src={value} alt="Headshot" /> : <ImagePlus size={26} strokeWidth={1.5} />}
      </div>
      <div className="photo-actions">
        <button type="button" className="btn btn--sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={15} /> {value ? 'Replace photo' : 'Upload photo'}
        </button>
        {value && (
          <>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setSource(value);
              }}
            >
              <Crop size={15} /> Adjust
            </button>
            <button type="button" className="btn btn--sm btn--ghost-danger" onClick={() => onChange(null)}>
              <Trash2 size={15} /> Remove
            </button>
          </>
        )}
        {error && <p className="field-error">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      {source && (
        <Modal
          title="Crop headshot"
          onClose={() => setSource(null)}
          footer={
            <>
              <button className="btn" onClick={() => setSource(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={save}>
                Use photo
              </button>
            </>
          }
        >
          <div className="cropper">
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={shape === 'circle' ? 'round' : 'rect'}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <label className="field field--inline">
            <span>Zoom</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <p className="hint">Drag the image to position it.</p>
        </Modal>
      )}
    </div>
  );
}
