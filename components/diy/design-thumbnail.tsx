'use client';

import type { CSSProperties } from 'react';

import { defaultBackground, getBackgroundStyle } from '@/lib/backgrounds';
import type { DesignState } from '@/types/dotti';

const THUMBNAIL_CANVAS_WIDTH = 720;
const THUMBNAIL_CANVAS_HEIGHT = 560;
const DEFAULT_BASE_COLOR = '#f8eee5';
const DEFAULT_FREE_SHAPE = {
  width: 64,
  height: 58,
  radius: 22,
  rotation: 0,
};

export function DesignThumbnail({ design, className = '' }: { design: DesignState; className?: string }) {
  const canvasWidth = design.canvasWidth || THUMBNAIL_CANVAS_WIDTH;
  const canvasHeight = design.canvasHeight || THUMBNAIL_CANVAS_HEIGHT;
  const freeShape = design.baseCustomShape ?? DEFAULT_FREE_SHAPE;
  const baseStyle =
    design.customBaseUrl
      ? getCustomBaseStyle(design.customBaseUrl, design.customBaseAspectRatio ?? 1)
      : ({
          '--base-color': design.baseColor ?? DEFAULT_BASE_COLOR,
          '--base-free-width': `${freeShape.width}%`,
          '--base-free-height': `${freeShape.height}%`,
          '--base-free-radius': `${freeShape.radius}%`,
          '--base-free-rotation': `${freeShape.rotation}deg`,
        } as CSSProperties);

  return (
    <div
      className={`relative aspect-[720/560] w-full overflow-hidden rounded-[22px] ${className}`}
      style={getBackgroundStyle(design.background ?? defaultBackground)}
      aria-label="Current Felti design preview"
    >
      <div className={`brooch-base preview-base brooch-${design.customBaseUrl ? 'custom' : design.baseShape}`} style={baseStyle} />
      {[...(design.elements ?? [])]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${(element.x / canvasWidth) * 100}%`,
              top: `${(element.y / canvasHeight) * 100}%`,
              width: `${(element.width / canvasWidth) * 100}%`,
              height: `${(element.height / canvasHeight) * 100}%`,
              zIndex: element.zIndex,
              transform: `rotate(${element.rotation}deg) scale(${element.flipX ? -1 : 1}, ${element.flipY ? -1 : 1})`,
            }}
          >
            {element.colorEditable && element.color ? (
              <div
                className="h-full w-full"
                style={{
                  background: element.color,
                  maskImage: `url(${element.imageUrl})`,
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                  maskSize: 'contain',
                  WebkitMaskImage: `url(${element.imageUrl})`,
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: 'contain',
                }}
              />
            ) : (
              <img
                src={element.imageUrl}
                alt=""
                className={`h-full w-full object-contain ${element.source === 'upload' ? 'drop-shadow-sm' : 'felt-asset'}`}
                draggable={false}
              />
            )}
          </div>
        ))}
    </div>
  );
}

function getCustomBaseStyle(imageUrl: string, aspectRatio: number): CSSProperties {
  const safeRatio = Math.max(0.2, Math.min(5, aspectRatio || 1));
  let width = 66;
  let height = 66;
  if (safeRatio > 1) {
    height = width / safeRatio;
  } else {
    width = height * safeRatio;
  }

  return {
    '--custom-base-width': `${width}%`,
    '--custom-base-height': `${height}%`,
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
  } as CSSProperties;
}
