'use client';

import { ArrowRight, Download, Eye, RotateCcw, Save, Undo2, Redo2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type EditorToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onNext: () => void;
  backgroundControl: ReactNode;
};

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onSave,
  onPreview,
  onDownload,
  onNext,
  backgroundControl,
}: EditorToolbarProps) {
  return (
    <div className="diy-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dotti-border)] bg-[var(--dotti-bg)] px-4 py-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="rounded-full bg-white" onClick={onUndo} disabled={!canUndo} title="Undo">
          <Undo2 className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full bg-white" onClick={onRedo} disabled={!canRedo} title="Redo">
          <Redo2 className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full bg-white" onClick={onReset} title="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {backgroundControl}
        <Button variant="outline" className="rounded-full bg-white" onClick={onSave}>
          <Save className="size-4" />
          Save
        </Button>
        <Button variant="outline" className="rounded-full bg-white" onClick={onDownload}>
          <Download className="size-4" />
          Download
        </Button>
        <Button className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]" onClick={onPreview}>
          <Eye className="size-4" />
          Preview
        </Button>
        <Button className="rounded-full bg-[var(--dotti-ink)] text-white" onClick={onNext}>
          <ArrowRight className="size-4" />
          Next
        </Button>
      </div>
    </div>
  );
}
