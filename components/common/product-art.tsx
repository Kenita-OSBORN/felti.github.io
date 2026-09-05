import { dottiAssets } from '@/data/assets';

export function ProductArt({ assetIds, imageUrl, alt = '', className = '' }: { assetIds: string[]; imageUrl?: string; alt?: string; className?: string }) {
  const assets = assetIds
    .map((id) => dottiAssets.find((asset) => asset.id === id))
    .filter(Boolean);

  if (imageUrl) {
    return (
      <div className={`felt-surface relative aspect-square overflow-hidden rounded-[28px] bg-[var(--dotti-felt)] shadow-inner ${className}`}>
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`felt-surface relative aspect-square rounded-[28px] bg-[var(--dotti-felt)] shadow-inner ${className}`}>
      {assets.map((asset, index) => (
        <img
          key={`${asset!.id}-${index}`}
          src={asset!.imageUrl}
          alt=""
          className="felt-asset absolute h-[34%] w-[34%] object-contain"
          style={{
            left: `${22 + index * 18}%`,
            top: `${22 + (index % 2) * 23}%`,
            transform: `rotate(${index * 15 - 8}deg)`,
          }}
        />
      ))}
    </div>
  );
}
