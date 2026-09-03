'use client';

import { Crown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function VIPAssetModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] border-[var(--dotti-border)] bg-[var(--dotti-bg)] sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-[var(--dotti-gold)]">
            <Crown className="size-6 text-[var(--dotti-brown)]" />
          </div>
          <DialogTitle className="text-2xl font-black">
            This decoration is available for Dotti VIP members.
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full bg-white" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button render={<a href="/vip" />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
            Explore VIP
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
