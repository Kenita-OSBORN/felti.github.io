'use client';

import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Copy, FlipHorizontal2, Layers, Palette, SendToBack, Trash2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { defaultBackground, getBackgroundStyle } from '@/lib/backgrounds';
import { assetColorPresets } from '@/lib/color-palettes';
import type { BaseCustomShape, BaseShape, DesignBackground, DesignElement } from '@/types/dotti';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 560;
const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const DEFAULT_FREE_SHAPE: BaseCustomShape = {
  width: 64,
  height: 58,
  radius: 22,
  rotation: 0,
};

const canElementUseColor = (element?: DesignElement | null) =>
  Boolean(element && element.source !== 'upload' && element.assetId.startsWith('letter-'));

const getLetterMaskUrl = (element: DesignElement) => {
  const letter = element.assetName.replace('Letter ', '').trim() || element.assetId.replace('letter-', '').toUpperCase();
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><text x="48" y="72" font-family="'Arial Rounded MT Bold', 'Nunito Sans', Arial, sans-serif" font-size="70" font-weight="900" text-anchor="middle" fill="#fff">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(maskSvg)}`;
};

const getCustomBaseSize = (aspectRatio = 1, containerAspectRatio = CANVAS_ASPECT_RATIO) => {
  const maxWidth = 70;
  const maxHeight = 70;
  const safeRatio = Math.max(0.2, Math.min(5, aspectRatio || 1));
  let width = maxWidth;
  let height = (width * containerAspectRatio) / safeRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = (height * safeRatio) / containerAspectRatio;
  }

  return { width, height };
};

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
  baseColor: string;
  baseCustomShape: BaseCustomShape;
  background?: DesignBackground;
  customBaseUrl?: string | null;
  customBaseAspectRatio?: number | null;
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelect: (id: string | null) => void;
  onDropAsset: (assetId: string, x: number, y: number) => void;
  onChangeElement: (id: string, patch: Partial<DesignElement>, commit?: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayer: (action: 'forward' | 'backward' | 'front' | 'back') => void;
  onFlip: (axis: 'x' | 'y') => void;
};

export function DesignCanvas({
  baseShape,
  baseColor,
  baseCustomShape,
  background,
  customBaseUrl,
  customBaseAspectRatio,
  elements,
  selectedElementId,
  onSelect,
  onDropAsset,
  onChangeElement,
  onDuplicate,
  onDelete,
  onLayer,
  onFlip,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const freeShape = baseCustomShape ?? DEFAULT_FREE_SHAPE;

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

  const recoloredAssetStyle = (element: DesignElement): CSSProperties =>
    ({
      '--asset-color': element.color,
      background: element.color,
      backgroundImage: 'none',
      maskImage: `url("${getLetterMaskUrl(element)}")`,
      WebkitMaskImage: `url("${getLetterMaskUrl(element)}")`,
    }) as CSSProperties;

  const canRecolor = canElementUseColor(selectedElement);
  const customBaseSize = getCustomBaseSize(customBaseAspectRatio ?? 1);
  const baseStyle = customBaseUrl
    ? ({
        '--custom-base-width': `${customBaseSize.width}%`,
        '--custom-base-height': `${customBaseSize.height}%`,
        backgroundImage: `url(${customBaseUrl})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } as CSSProperties)
    : ({
        '--base-color': baseColor,
        '--base-free-width': `${freeShape.width}%`,
        '--base-free-height': `${freeShape.height}%`,
        '--base-free-radius': `${freeShape.radius}%`,
        '--base-free-rotation': `${freeShape.rotation}deg`,
      } as CSSProperties);

  return (
    <div className="diy-canvas-shell flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4" style={getBackgroundStyle(background ?? defaultBackground)}>
      <div
        ref={canvasRef}
        className="relative aspect-[720/560] max-h-full w-full max-w-[920px] overflow-hidden rounded-[28px] border border-[var(--dotti-border)] bg-white/42 shadow-[var(--dotti-shadow)]"
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
        <div
          className={`brooch-base brooch-${customBaseUrl ? 'custom' : baseShape}`}
          style={baseStyle}
        />

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
                {canElementUseColor(element) && element.color ? (
                  <div className="recolored-felt-asset h-full w-full" style={recoloredAssetStyle(element)} />
                ) : (
                  <img src={element.imageUrl} alt="" className={`h-full w-full object-contain ${element.source === 'upload' ? 'drop-shadow-sm' : 'felt-asset'}`} draggable={false} />
                )}
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
                      className="absolute bottom-[-14px] left-[-14px] h-7 w-7 rounded-full border-2 border-white bg-[var(--dotti-gold)] shadow-md"
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
        {selectedElement && (
          <>
            <div
              className="absolute z-[1000] flex items-center gap-1 rounded-full border border-[var(--dotti-border)] bg-white/95 p-1 shadow-lg"
              style={{
                left: `${((selectedElement.x + selectedElement.width / 2) / CANVAS_WIDTH) * 100}%`,
                top: `${(Math.max(8, selectedElement.y - 54) / CANVAS_HEIGHT) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <button type="button" aria-label="Duplicate" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dotti-blush)]" onClick={onDuplicate}>
                <Copy className="size-4" />
              </button>
              {canRecolor && (
                <Popover>
                  <PopoverTrigger render={<button type="button" aria-label="Color" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dotti-blush)]" onPointerDown={(event) => event.stopPropagation()} />}>
                    <Palette className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" className="w-72 rounded-[24px] border-[var(--dotti-border)] bg-white p-3">
                    <p className="font-black">Color</p>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {assetColorPresets.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          aria-label={item.label}
                          onClick={() => onChangeElement(selectedElement.id, { color: item.color }, true)}
                          className={`size-9 rounded-full ring-2 ${selectedElement.color?.toLowerCase() === item.color.toLowerCase() ? 'ring-[var(--dotti-berry)]' : 'ring-[var(--dotti-border)]'}`}
                          style={{ backgroundColor: item.color }}
                        />
                      ))}
                    </div>
                    <label className="mt-3 block text-xs font-black text-[var(--dotti-muted)]">
                      Custom
                      <input
                        type="color"
                        value={selectedElement.color ?? '#d85d7d'}
                        onChange={(event) => onChangeElement(selectedElement.id, { color: event.target.value }, true)}
                        className="mt-2 h-9 w-full rounded-full border border-[var(--dotti-border)] bg-white p-1"
                      />
                    </label>
                  </PopoverContent>
                </Popover>
              )}
              <button type="button" aria-label="Flip" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dotti-blush)]" onClick={() => onFlip('x')}>
                <FlipHorizontal2 className="size-4" />
              </button>
              <button type="button" aria-label="Bring forward" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dotti-blush)]" onClick={() => onLayer('forward')}>
                <Layers className="size-4" />
              </button>
              <button type="button" aria-label="Send backward" className="grid size-8 place-items-center rounded-full hover:bg-[var(--dotti-blush)]" onClick={() => onLayer('backward')}>
                <SendToBack className="size-4" />
              </button>
              <button type="button" aria-label="Delete" className="grid size-8 place-items-center rounded-full text-red-600 hover:bg-red-50" onClick={onDelete}>
                <Trash2 className="size-4" />
              </button>
            </div>
            <span className="sr-only">Selected {selectedElement.assetName}</span>
          </>
        )}
      </div>
    </div>
  );
}

export { CANVAS_HEIGHT, CANVAS_WIDTH };
