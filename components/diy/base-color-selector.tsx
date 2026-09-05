'use client';

import { Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { baseColorPresets } from '@/lib/color-palettes';

type BaseColorSelectorProps = {
  value: string;
  onChange: (color: string) => void;
};

export function BaseColorSelector({ value, onChange }: BaseColorSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="rounded-full bg-white" />}>
        <Palette className="size-4" />
        Base Color
        <span className="size-4 rounded-full ring-1 ring-[var(--dotti-border)]" style={{ backgroundColor: value }} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-[28px] border-[var(--dotti-border)] bg-white p-4">
        <p className="font-black">Felt Base Color</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {baseColorPresets.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChange(item.color)}
              className={`rounded-2xl border p-2 text-xs font-black ${value.toLowerCase() === item.color.toLowerCase() ? 'border-[var(--dotti-berry)] bg-[var(--dotti-blush)]' : 'border-[var(--dotti-border)] bg-white'}`}
            >
              <span className="mx-auto mb-2 block size-8 rounded-full ring-1 ring-[var(--dotti-border)]" style={{ backgroundColor: item.color }} />
              {item.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-black">
          Custom Color
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 h-10 w-full rounded-full border border-[var(--dotti-border)] bg-white p-1"
          />
        </label>
      </PopoverContent>
    </Popover>
  );
}
