'use client';

import type { CSSProperties } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { defaultBackground, getBackgroundStyle } from '@/lib/backgrounds';
import type { BaseCustomShape, BaseShape, DesignBackground, DesignElement } from '@/types/dotti';

const DEFAULT_FREE_SHAPE: BaseCustomShape = {
  width: 64,
  height: 58,
  radius: 22,
  rotation: 0,
};

const getCustomBaseSize = (aspectRatio = 1) => {
  const maxWidth = 72;
  const maxHeight = 72;
  const safeRatio = Math.max(0.2, Math.min(5, aspectRatio || 1));
  let width = maxWidth;
  let height = width / safeRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeRatio;
  }

  return { width, height };
};

const canElementUseColor = (element: DesignElement) =>
  element.source !== 'upload' && element.assetId.startsWith('letter-');

const getLetterMaskUrl = (element: DesignElement) => {
  const letter = element.assetName.replace('Letter ', '').trim() || element.assetId.replace('letter-', '').toUpperCase();
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><text x="48" y="72" font-family="'Arial Rounded MT Bold', 'Nunito Sans', Arial, sans-serif" font-size="70" font-weight="900" text-anchor="middle" fill="#fff">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(maskSvg)}`;
};

export function PreviewModal({
  open,
  onOpenChange,
  baseShape,
  baseColor,
  baseCustomShape,
  background,
  customBaseUrl,
  customBaseAspectRatio,
  elements,
  onOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseShape: BaseShape;
  baseColor: string;
  baseCustomShape: BaseCustomShape;
  background?: DesignBackground;
  customBaseUrl?: string | null;
  customBaseAspectRatio?: number | null;
  elements: DesignElement[];
  onOrder: () => void;
}) {
  const freeShape = baseCustomShape ?? DEFAULT_FREE_SHAPE;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] border-[var(--dotti-border)] bg-[var(--dotti-bg)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Design Preview</DialogTitle>
        </DialogHeader>
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[28px] p-8 shadow-inner" style={getBackgroundStyle(background ?? defaultBackground)}>
          <div
            className={`brooch-base preview-base brooch-${customBaseUrl ? 'custom' : baseShape}`}
            style={baseStyle}
          />
          {[...elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${(element.x / 720) * 100}%`,
                  top: `${(element.y / 560) * 100}%`,
                  width: `${(element.width / 720) * 100}%`,
                  height: `${(element.height / 560) * 100}%`,
                  zIndex: element.zIndex,
                  transform: `rotate(${element.rotation}deg) scale(${element.flipX ? -1 : 1}, ${element.flipY ? -1 : 1})`,
                }}
              >
                {canElementUseColor(element) && element.color ? (
                  <div
                    className="recolored-felt-asset h-full w-full"
                    style={{
                      '--asset-color': element.color,
                      background: element.color,
                      backgroundImage: 'none',
                      maskImage: `url("${getLetterMaskUrl(element)}")`,
                      WebkitMaskImage: `url("${getLetterMaskUrl(element)}")`,
                    } as CSSProperties}
                  />
                ) : (
                  <img src={element.imageUrl} alt="" className={`h-full w-full object-contain ${element.source === 'upload' ? 'drop-shadow-sm' : 'felt-asset'}`} draggable={false} />
                )}
              </div>
            ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full bg-white" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onOrder} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
            Order This Design
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
