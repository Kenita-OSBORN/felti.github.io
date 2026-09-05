'use client';

import { Crown, Image, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { defaultBackground, patternBackgrounds, solidBackgrounds } from '@/lib/backgrounds';
import type { DesignBackground } from '@/types/dotti';

type BackgroundSelectorProps = {
  value: DesignBackground;
  canUseVIP: boolean;
  onChange: (background: DesignBackground) => void;
  onUpload: () => void;
  onLockedVIP: () => void;
};

export function BackgroundSelector({
  value,
  canUseVIP,
  onChange,
  onUpload,
  onLockedVIP,
}: BackgroundSelectorProps) {
  const current = value ?? defaultBackground;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="rounded-full bg-white" />}>
        <Palette className="size-4" />
        Background
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-[28px] border-[var(--dotti-border)] bg-white p-4">
        <div>
          <p className="font-black">Solid Colors</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {solidBackgrounds.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onChange({ type: 'solid', color: item.color, pattern: 'plain', imageUrl: null })}
                className={`rounded-2xl border p-2 text-xs font-black ${current.color === item.color && current.type !== 'upload' ? 'border-[var(--dotti-berry)]' : 'border-[var(--dotti-border)]'}`}
              >
                <span className="mx-auto mb-2 block size-8 rounded-full ring-1 ring-[var(--dotti-border)]" style={{ backgroundColor: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="font-black">Felti Backgrounds</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {patternBackgrounds.map((item) => (
              <button
                key={item.pattern}
                type="button"
                onClick={() => onChange({ type: 'pattern', color: current.color || defaultBackground.color, pattern: item.pattern, imageUrl: null })}
                className={`rounded-2xl border px-3 py-2 text-left text-sm font-bold ${current.pattern === item.pattern ? 'border-[var(--dotti-berry)] bg-[var(--dotti-blush)]' : 'border-[var(--dotti-border)] bg-[var(--dotti-bg)]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-4 block text-sm font-black">
          Custom Color
          <input
            type="color"
            value={current.color || defaultBackground.color}
            onChange={(event) => onChange({ ...current, color: event.target.value, type: current.type === 'upload' ? 'pattern' : current.type, imageUrl: current.type === 'upload' ? null : current.imageUrl })}
            className="mt-2 h-10 w-full rounded-full border border-[var(--dotti-border)] bg-white p-1"
          />
        </label>

        <Button
          variant="outline"
          className="mt-4 w-full rounded-full bg-white"
          onClick={canUseVIP ? onUpload : onLockedVIP}
        >
          <Image className="size-4" />
          Upload Background
          <Crown className={`size-4 ${canUseVIP ? 'text-[var(--dotti-gold)]' : 'text-[var(--dotti-muted)]'}`} />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
