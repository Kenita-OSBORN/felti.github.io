import { dottiAssets } from '@/data/assets';

export function AccessoryPreview({ assetIds, className = '', assetClassName = 'h-[72px] w-[72px]' }: { assetIds: string[]; className?: string; assetClassName?: string }) {
  const assets = assetIds
    .map((id) => dottiAssets.find((asset) => asset.id === id))
    .filter(Boolean);

  return (
    <div className={`relative mx-auto aspect-square w-full max-w-[220px] ${className}`}>
      <div className="absolute inset-4 rounded-full bg-[var(--dotti-felt)] shadow-inner ring-1 ring-[var(--dotti-border)]" />
      {assets.map((asset, index) => (
        <img
          key={asset!.id}
          src={asset!.imageUrl}
          alt=""
          className={`felt-asset absolute ${assetClassName}`}
          style={{
            left: `${24 + index * 18}%`,
            top: `${23 + (index % 2) * 22}%`,
            transform: `rotate(${index * 14 - 10}deg)`,
          }}
        />
      ))}
    </div>
  );
}
