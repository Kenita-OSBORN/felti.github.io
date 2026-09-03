'use client';

import { Copy, FlipHorizontal2, FlipVertical2, Layers, SendToBack, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { DesignElement } from '@/types/dotti';

type PropertiesPanelProps = {
  selectedElement: DesignElement | undefined;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayer: (action: 'forward' | 'backward' | 'front' | 'back') => void;
  onFlip: (axis: 'x' | 'y') => void;
};

const stat = (label: string, value: string | number) => (
  <div className="rounded-2xl bg-[var(--dotti-bg)] px-3 py-2">
    <dt className="text-xs font-bold text-[var(--dotti-muted)]">{label}</dt>
    <dd className="mt-1 text-sm font-black text-[var(--dotti-ink)]">{value}</dd>
  </div>
);

export function PropertiesPanel({
  selectedElement,
  onDuplicate,
  onDelete,
  onLayer,
  onFlip,
}: PropertiesPanelProps) {
  return (
    <aside className="border-l border-[var(--dotti-border)] bg-white/86 p-4">
      <h2 className="text-lg font-black">Properties</h2>
      {!selectedElement ? (
        <div className="mt-4 rounded-3xl bg-[var(--dotti-bg)] p-5 text-sm leading-6 text-[var(--dotti-muted)]">
          Select an element to edit it.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-[var(--dotti-border)] bg-white p-4">
            <p className="text-sm font-bold text-[var(--dotti-muted)]">Asset name</p>
            <p className="mt-1 text-xl font-black">{selectedElement.assetName}</p>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            {stat('X', Math.round(selectedElement.x))}
            {stat('Y', Math.round(selectedElement.y))}
            {stat('Width', Math.round(selectedElement.width))}
            {stat('Height', Math.round(selectedElement.height))}
            {stat('Rotation', `${Math.round(selectedElement.rotation)} deg`)}
            {stat('Layer', selectedElement.zIndex)}
          </dl>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full bg-white" onClick={onDuplicate}>
              <Copy className="size-4" />
              Duplicate
            </Button>
            <Button variant="outline" className="rounded-full bg-white text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button variant="outline" className="rounded-full bg-white" onClick={() => onFlip('x')}>
              <FlipHorizontal2 className="size-4" />
              Flip H
            </Button>
            <Button variant="outline" className="rounded-full bg-white" onClick={() => onFlip('y')}>
              <FlipVertical2 className="size-4" />
              Flip V
            </Button>
          </div>

          <div className="space-y-2 rounded-3xl bg-[var(--dotti-bg)] p-3">
            <Button variant="ghost" className="w-full justify-start rounded-full" onClick={() => onLayer('forward')}>
              <Layers className="size-4" />
              Bring Forward
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-full" onClick={() => onLayer('backward')}>
              <Layers className="size-4" />
              Send Backward
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-full" onClick={() => onLayer('front')}>
              <Layers className="size-4" />
              Bring to Front
            </Button>
            <Button variant="ghost" className="w-full justify-start rounded-full" onClick={() => onLayer('back')}>
              <SendToBack className="size-4" />
              Send to Back
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
