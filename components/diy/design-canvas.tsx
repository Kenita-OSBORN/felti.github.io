'use client';

import { useRef, useState } from 'react';

import type { BaseShape, DesignElement } from '@/types/dotti';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 560;

type Interaction =
  | {
      mode: 'move';
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      original: DesignElement;
    }
  | {
      mode: 'resize';
      id: string;
      pointerId: number;
      startX: number;
      startY: number;
      original: DesignElement;
    }
  | {
      mode: 'rotate';
      id: string;
      pointerId: number;
      centerX: number;
      centerY: number;
      startAngle: number;
      originalRotation: number;
    };

type DesignCanvasProps = {
  baseShape: BaseShape;
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelect: (id: string | null) => void;
  onDropAsset: (assetId: string, x: number, y: number) => void;
  onChangeElement: (id: string, patch: Partial<DesignElement>, commit?: boolean) => void;
};

export function DesignCanvas({
  baseShape,
  elements,
  selectedElementId,
  onSelect,
  onDropAsset,
  onChangeElement,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);

  const toCanvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interaction) return;
    event.preventDefault();

    if (interaction.mode === 'move') {
      const point = toCanvasPoint(event.clientX, event.clientY);
      const dx = point.x - interaction.startX;
      const dy = point.y - interaction.startY;
      onChangeElement(interaction.id, {
        x: Math.max(0, Math.min(CANVAS_WIDTH - interaction.original.width, interaction.original.x + dx)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT - interaction.original.height, interaction.original.y + dy)),
      });
    }

    if (interaction.mode === 'resize') {
      const point = toCanvasPoint(event.clientX, event.clientY);
      const dx = point.x - interaction.startX;
      const nextSize = Math.max(32, Math.min(260, interaction.original.width + dx));
      onChangeElement(interaction.id, {
        width: nextSize,
        height: Math.max(32, Math.min(260, interaction.original.height + dx)),
      });
    }

    if (interaction.mode === 'rotate') {
      const point = toCanvasPoint(event.clientX, event.clientY);
      const nextAngle =
        Math.atan2(point.y - interaction.centerY, point.x - interaction.centerX) *
          (180 / Math.PI) -
        interaction.startAngle +
        interaction.originalRotation;
      onChangeElement(interaction.id, { rotation: nextAngle });
    }
  };

  const finishInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interaction) return;
    onChangeElement(interaction.id, {}, true);
    event.currentTarget.releasePointerCapture(interaction.pointerId);
    setInteraction(null);
  };

  const selectedElement = elements.find((element) => element.id === selectedElementId);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[linear-gradient(0deg,rgba(122,86,72,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(122,86,72,0.04)_1px,transparent_1px)] bg-[size:28px_28px] p-5">
      <div
        ref={canvasRef}
        className="relative aspect-[720/560] w-full max-w-[920px] overflow-hidden rounded-[28px] border border-[var(--dotti-border)] bg-[#fffdf9] shadow-[var(--dotti-shadow)]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const assetId = event.dataTransfer.getData('text/dotti-asset');
          if (!assetId) return;
          const point = toCanvasPoint(event.clientX, event.clientY);
          onDropAsset(assetId, point.x, point.y);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onSelect(null);
        }}
      >
        <div className={`brooch-base brooch-${baseShape}`} />

        {[...elements]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((element) => {
            const isSelected = element.id === selectedElementId;
            return (
              <div
                key={element.id}
                className={`absolute touch-none select-none ${isSelected ? 'z-[999]' : ''}`}
                style={{
                  left: `${(element.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
                  width: `${(element.width / CANVAS_WIDTH) * 100}%`,
                  height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
                  zIndex: isSelected ? 999 : element.zIndex,
                  transform: `rotate(${element.rotation}deg) scale(${element.flipX ? -1 : 1}, ${element.flipY ? -1 : 1})`,
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(element.id);
                  const point = toCanvasPoint(event.clientX, event.clientY);
                  event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
                  setInteraction({
                    mode: 'move',
                    id: element.id,
                    pointerId: event.pointerId,
                    startX: point.x,
                    startY: point.y,
                    original: element,
                  });
                }}
              >
                <img src={element.imageUrl} alt="" className="h-full w-full object-contain drop-shadow-sm" draggable={false} />
                {isSelected && (
                  <>
                    <div className="pointer-events-none absolute inset-[-6px] rounded-2xl border-2 border-[var(--dotti-berry)]" />
                    <button
                      type="button"
                      aria-label="Resize selected decoration"
                      className="absolute bottom-[-13px] right-[-13px] h-6 w-6 rounded-full border-2 border-white bg-[var(--dotti-berry)] shadow-md"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const point = toCanvasPoint(event.clientX, event.clientY);
                        event.currentTarget.parentElement?.parentElement?.setPointerCapture(event.pointerId);
                        setInteraction({
                          mode: 'resize',
                          id: element.id,
                          pointerId: event.pointerId,
                          startX: point.x,
                          startY: point.y,
                          original: element,
                        });
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Rotate selected decoration"
                      className="absolute left-1/2 top-[-38px] h-7 w-7 -translate-x-1/2 rounded-full border-2 border-white bg-[var(--dotti-gold)] shadow-md"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const center = {
                          x: element.x + element.width / 2,
                          y: element.y + element.height / 2,
                        };
                        const point = toCanvasPoint(event.clientX, event.clientY);
                        const startAngle =
                          Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
                        event.currentTarget.parentElement?.parentElement?.setPointerCapture(event.pointerId);
                        setInteraction({
                          mode: 'rotate',
                          id: element.id,
                          pointerId: event.pointerId,
                          centerX: center.x,
                          centerY: center.y,
                          startAngle,
                          originalRotation: element.rotation,
                        });
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}

        {elements.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm font-semibold text-[var(--dotti-muted)]">
            Drop or click decorations to begin.
          </div>
        )}
        {selectedElement && <span className="sr-only">Selected {selectedElement.assetName}</span>}
      </div>
    </div>
  );
}

export { CANVAS_HEIGHT, CANVAS_WIDTH };
