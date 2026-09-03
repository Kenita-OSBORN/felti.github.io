'use client';

import type { BaseShape } from '@/types/dotti';

const shapeOptions: BaseShape[] = ['circle', 'oval', 'heart'];

export function BaseShapeSelector({
  value,
  onChange,
}: {
  value: BaseShape;
  onChange: (shape: BaseShape) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--dotti-border)]">
      {shapeOptions.map((shape) => (
        <button
          key={shape}
          type="button"
          onClick={() => onChange(shape)}
          className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
            value === shape
              ? 'bg-[var(--dotti-berry)] text-white'
              : 'text-[var(--dotti-muted)] hover:bg-[var(--dotti-blush)] hover:text-[var(--dotti-ink)]'
          }`}
        >
          {shape}
        </button>
      ))}
    </div>
  );
}
