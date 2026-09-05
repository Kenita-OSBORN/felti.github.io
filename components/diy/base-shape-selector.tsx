'use client';

import { Crown, Upload } from 'lucide-react';

import type { BaseCustomShape, BaseShape, BaseSize } from '@/types/dotti';

const shapeOptions: { value: BaseShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'oval', label: 'Oval' },
  { value: 'square', label: 'Square' },
  { value: 'free', label: 'Free Shape' },
];
const sizeOptions: { value: BaseSize; label: string }[] = [
  { value: 'S', label: 'S · 5 cm' },
  { value: 'M', label: 'M · 7 cm' },
  { value: 'L', label: 'L · 9 cm' },
];

const freeControls: { key: keyof BaseCustomShape; label: string; min: number; max: number; suffix: string }[] = [
  { key: 'width', label: 'Width', min: 38, max: 82, suffix: '%' },
  { key: 'height', label: 'Height', min: 34, max: 78, suffix: '%' },
  { key: 'radius', label: 'Corners', min: 0, max: 50, suffix: '%' },
  { key: 'rotation', label: 'Tilt', min: -25, max: 25, suffix: '°' },
];

export function BaseShapeSelector({
  value,
  size,
  freeShape,
  canUseVIP,
  onChange,
  onSizeChange,
  onFreeShapeChange,
  onUploadBase,
}: {
  value: BaseShape;
  size: BaseSize;
  freeShape: BaseCustomShape;
  canUseVIP: boolean;
  onChange: (shape: BaseShape) => void;
  onSizeChange: (size: BaseSize) => void;
  onFreeShapeChange: (shape: BaseCustomShape) => void;
  onUploadBase: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--dotti-border)]">
        {shapeOptions.map((shape) => (
          <button
            key={shape.value}
            type="button"
            onClick={() => onChange(shape.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              value === shape.value
                ? 'bg-[var(--dotti-berry)] text-white'
                : 'text-[var(--dotti-muted)] hover:bg-[var(--dotti-blush)] hover:text-[var(--dotti-ink)]'
            }`}
          >
            {shape.label}
          </button>
        ))}
      </div>
      {value === 'free' && (
        <div className="grid min-w-[280px] gap-2 rounded-[22px] bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--dotti-border)]">
          {freeControls.map((control) => (
            <label key={control.key} className="grid grid-cols-[72px_1fr_44px] items-center gap-2 text-xs font-black text-[var(--dotti-muted)]">
              <span>{control.label}</span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                value={freeShape[control.key]}
                onChange={(event) => onFreeShapeChange({ ...freeShape, [control.key]: Number(event.target.value) })}
                className="accent-[var(--dotti-berry)]"
              />
              <span className="text-right text-[var(--dotti-ink)]">{freeShape[control.key]}{control.suffix}</span>
            </label>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--dotti-border)]">
        {sizeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSizeChange(option.value)}
            className={`rounded-full px-3 py-2 text-xs font-black transition ${
              size === option.value
                ? 'bg-[var(--dotti-ink)] text-white'
                : 'text-[var(--dotti-muted)] hover:bg-[var(--dotti-blush)] hover:text-[var(--dotti-ink)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onUploadBase}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[var(--dotti-muted)] shadow-sm ring-1 ring-[var(--dotti-border)] hover:bg-[var(--dotti-blush)]"
        >
          <Upload className="size-4" />
          Upload My Base
          <Crown className={`size-4 ${canUseVIP ? 'text-[var(--dotti-gold)]' : 'text-[var(--dotti-muted)]'}`} />
        </button>
        <span className="max-w-[220px] text-xs font-bold leading-4 text-[var(--dotti-muted)]">Simple shapes and clear outlines work best.</span>
      </div>
    </div>
  );
}
