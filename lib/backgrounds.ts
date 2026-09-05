import type { CSSProperties } from 'react';
import type { DesignBackground } from '@/types/dotti';

export const defaultBackground: DesignBackground = {
  type: 'pattern',
  color: '#fffdf9',
  pattern: 'soft-grid',
  imageUrl: null,
};

export const solidBackgrounds = [
  { label: 'Warm White', color: '#fffdf9' },
  { label: 'Cream', color: '#fff0d6' },
  { label: 'Soft Pink', color: '#fde2e4' },
  { label: 'Light Beige', color: '#f4eadf' },
  { label: 'Pale Blue', color: '#d7edf4' },
  { label: 'Light Gray', color: '#f3f3f0' },
];

export const patternBackgrounds = [
  { label: 'Plain', pattern: 'plain' },
  { label: 'Soft Grid', pattern: 'soft-grid' },
  { label: 'Small Dots', pattern: 'small-dots' },
  { label: 'Subtle Paper', pattern: 'subtle-paper' },
  { label: 'Soft Fabric', pattern: 'soft-fabric' },
] as const;

export function getBackgroundStyle(background?: DesignBackground): CSSProperties {
  const bg = background ?? defaultBackground;
  if (bg.type === 'upload' && bg.imageUrl) {
    return {
      backgroundColor: bg.color,
      backgroundImage: `linear-gradient(rgb(255 255 255 / 16%), rgb(255 255 255 / 16%)), url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const color = bg.color || defaultBackground.color;
  if (bg.pattern === 'soft-grid') {
    return {
      backgroundColor: color,
      backgroundImage:
        'linear-gradient(0deg, rgb(122 86 72 / 5%) 1px, transparent 1px), linear-gradient(90deg, rgb(122 86 72 / 5%) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    };
  }
  if (bg.pattern === 'small-dots') {
    return {
      backgroundColor: color,
      backgroundImage: 'radial-gradient(circle, rgb(122 86 72 / 10%) 1px, transparent 1.5px)',
      backgroundSize: '20px 20px',
    };
  }
  if (bg.pattern === 'subtle-paper') {
    return {
      backgroundColor: color,
      backgroundImage:
        'radial-gradient(circle at 20% 20%, rgb(255 255 255 / 50%), transparent 16%), radial-gradient(circle at 75% 65%, rgb(125 90 80 / 5%), transparent 20%)',
    };
  }
  if (bg.pattern === 'soft-fabric') {
    return {
      backgroundColor: color,
      backgroundImage:
        'repeating-linear-gradient(45deg, rgb(125 90 80 / 4%) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgb(255 255 255 / 30%) 0 1px, transparent 1px 8px)',
    };
  }
  return { backgroundColor: color };
}
