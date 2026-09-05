'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function RestoreDraftModal({
  open,
  onStartNew,
  onRestore,
}: {
  open: boolean;
  onStartNew: () => void;
  onRestore: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="rounded-[28px] border-[var(--dotti-border)] bg-[var(--dotti-bg)] sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">You have a saved Felti design.</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full bg-white" onClick={onStartNew}>
            Start New
          </Button>
          <Button className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]" onClick={onRestore}>
            Restore Design
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
