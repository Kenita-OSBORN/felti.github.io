'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { BaseShape, DesignElement } from '@/types/dotti';

export function PreviewModal({
  open,
  onOpenChange,
  baseShape,
  elements,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseShape: BaseShape;
  elements: DesignElement[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] border-[var(--dotti-border)] bg-[var(--dotti-bg)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Design Preview</DialogTitle>
        </DialogHeader>
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white p-8 shadow-inner">
          <div className={`brooch-base preview-base brooch-${baseShape}`} />
          {[...elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <img
                key={element.id}
                src={element.imageUrl}
                alt=""
                className="absolute object-contain"
                style={{
                  left: `${(element.x / 720) * 100}%`,
                  top: `${(element.y / 560) * 100}%`,
                  width: `${(element.width / 720) * 100}%`,
                  height: `${(element.height / 560) * 100}%`,
                  zIndex: element.zIndex,
                  transform: `rotate(${element.rotation}deg) scale(${element.flipX ? -1 : 1}, ${element.flipY ? -1 : 1})`,
                }}
              />
            ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full bg-white" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled className="rounded-full">
            Order This Design
          </Button>
        </div>
        <p className="text-right text-sm text-[var(--dotti-muted)]">Coming in the next development phase.</p>
      </DialogContent>
    </Dialog>
  );
}
