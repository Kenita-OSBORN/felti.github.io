'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Sparkles } from 'lucide-react';

import { AssetSidebar } from '@/components/diy/asset-sidebar';
import { BaseShapeSelector } from '@/components/diy/base-shape-selector';
import { CANVAS_HEIGHT, CANVAS_WIDTH, DesignCanvas } from '@/components/diy/design-canvas';
import { EditorToolbar } from '@/components/diy/editor-toolbar';
import { PreviewModal } from '@/components/diy/preview-modal';
import { PropertiesPanel } from '@/components/diy/properties-panel';
import { RestoreDraftModal } from '@/components/diy/restore-draft-modal';
import { VIPAssetModal } from '@/components/diy/vip-asset-modal';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { dottiAssets } from '@/data/assets';
import type { AssetCategory, BaseShape, DesignElement, DesignState, DottiAsset } from '@/types/dotti';

const STORAGE_KEY = 'dotti-design-draft-v1';

const createInitialDesign = (): DesignState => ({
  name: 'Untitled Dotti Brooch',
  baseShape: 'circle',
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  elements: [],
});

const normalizeLayers = (elements: DesignElement[]) =>
  [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((element, index) => ({ ...element, zIndex: index + 1 }));

export function DIYStudio() {
  const [design, setDesign] = useState<DesignState>(createInitialDesign);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignState[]>([createInitialDesign()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRestoreOpen(true);
  }, []);

  const selectedElement = useMemo(
    () => design.elements.find((element) => element.id === selectedElementId),
    [design.elements, selectedElementId],
  );

  const commitDesign = useCallback((nextDesign: DesignState) => {
    setDesign(nextDesign);
    setHistory((current) => {
      const nextHistory = current.slice(0, historyIndex + 1);
      nextHistory.push(nextDesign);
      return nextHistory.slice(-80);
    });
    setHistoryIndex((current) => Math.min(current + 1, 79));
  }, [historyIndex]);

  const setDesignWithoutHistory = (nextDesign: DesignState) => {
    setDesign(nextDesign);
  };

  const addAsset = (asset: DottiAsset, x = CANVAS_WIDTH / 2, y = CANVAS_HEIGHT / 2) => {
    if (asset.isVIP) {
      setVipModalOpen(true);
      return;
    }

    const maxLayer = Math.max(0, ...design.elements.map((element) => element.zIndex));
    const nextElement: DesignElement = {
      id: `${asset.id}-${crypto.randomUUID()}`,
      assetId: asset.id,
      assetName: asset.name,
      imageUrl: asset.imageUrl,
      x: Math.max(0, Math.min(CANVAS_WIDTH - 86, x - 43)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT - 86, y - 43)),
      width: 86,
      height: 86,
      rotation: 0,
      zIndex: maxLayer + 1,
      flipX: false,
      flipY: false,
    };

    const nextDesign = { ...design, elements: [...design.elements, nextElement] };
    commitDesign(nextDesign);
    setSelectedElementId(nextElement.id);
    setMobileLibraryOpen(false);
  };

  const changeElement = (id: string, patch: Partial<DesignElement>, commit = false) => {
    const nextDesign = {
      ...design,
      elements: design.elements.map((element) =>
        element.id === id ? { ...element, ...patch } : element,
      ),
    };
    if (commit) {
      commitDesign(nextDesign);
    } else {
      setDesignWithoutHistory(nextDesign);
    }
  };

  const updateBaseShape = (baseShape: BaseShape) => {
    commitDesign({ ...design, baseShape });
  };

  const deleteSelected = useCallback(() => {
    if (!selectedElementId) return;
    commitDesign({
      ...design,
      elements: normalizeLayers(design.elements.filter((element) => element.id !== selectedElementId)),
    });
    setSelectedElementId(null);
  }, [commitDesign, design, selectedElementId]);

  const duplicateSelected = useCallback(() => {
    const selected = design.elements.find((element) => element.id === selectedElementId);
    if (!selected) return;
    const copy = {
      ...selected,
      id: `${selected.assetId}-${crypto.randomUUID()}`,
      x: Math.min(CANVAS_WIDTH - selected.width, selected.x + 26),
      y: Math.min(CANVAS_HEIGHT - selected.height, selected.y + 26),
      zIndex: Math.max(...design.elements.map((element) => element.zIndex)) + 1,
    };
    commitDesign({ ...design, elements: [...design.elements, copy] });
    setSelectedElementId(copy.id);
  }, [commitDesign, design, selectedElementId]);

  const changeLayer = (action: 'forward' | 'backward' | 'front' | 'back') => {
    if (!selectedElementId) return;
    const ordered = normalizeLayers(design.elements);
    const currentIndex = ordered.findIndex((element) => element.id === selectedElementId);
    if (currentIndex < 0) return;
    const [selected] = ordered.splice(currentIndex, 1);
    const targetIndex =
      action === 'front'
        ? ordered.length
        : action === 'back'
          ? 0
          : action === 'forward'
            ? Math.min(ordered.length, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
    ordered.splice(targetIndex, 0, selected);
    commitDesign({ ...design, elements: normalizeLayers(ordered) });
  };

  const flipSelected = (axis: 'x' | 'y') => {
    if (!selectedElementId) return;
    const selected = design.elements.find((element) => element.id === selectedElementId);
    if (!selected) return;
    changeElement(
      selected.id,
      axis === 'x' ? { flipX: !selected.flipX } : { flipY: !selected.flipY },
      true,
    );
  };

  const undo = useCallback(() => {
    if (historyIndex === 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setDesign(history[nextIndex]);
    setSelectedElementId(null);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setDesign(history[nextIndex]);
    setSelectedElementId(null);
  }, [history, historyIndex]);

  const reset = () => {
    if (design.elements.length === 0) return;
    if (!window.confirm('Reset your Dotti design?')) return;
    commitDesign({ ...design, elements: [] });
    setSelectedElementId(null);
  };

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
  };

  const restoreDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const restored = JSON.parse(saved) as DesignState;
    setDesign(restored);
    setHistory([restored]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setRestoreOpen(false);
  };

  const startNew = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createInitialDesign();
    setDesign(fresh);
    setHistory([fresh]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setRestoreOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) {
        event.preventDefault();
        deleteSelected();
      }
      if (command && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      if (command && event.key.toLowerCase() === 'd' && selectedElementId) {
        event.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, duplicateSelected, redo, selectedElementId, undo]);

  const assetPanel = (
    <AssetSidebar
      selectedCategory={selectedCategory}
      searchTerm={searchTerm}
      onCategoryChange={setSelectedCategory}
      onSearchChange={setSearchTerm}
      onAddAsset={addAsset}
    />
  );

  const propertiesPanel = (
    <PropertiesPanel
      selectedElement={selectedElement}
      onDuplicate={duplicateSelected}
      onDelete={deleteSelected}
      onLayer={changeLayer}
      onFlip={flipSelected}
    />
  );

  return (
    <main className="flex min-h-screen flex-col bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />
      <section className="flex min-h-[calc(100vh-72px)] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dotti-border)] bg-white/70 px-4 py-3">
          <div>
            <a href="/" className="text-sm font-bold text-[var(--dotti-muted)] hover:text-[var(--dotti-ink)]">
              Dotti
            </a>
            <h1 className="text-2xl font-black">DIY Design Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <BaseShapeSelector value={design.baseShape} onChange={updateBaseShape} />
            </div>
            <Sheet open={mobileLibraryOpen} onOpenChange={setMobileLibraryOpen}>
              <SheetTrigger render={<Button variant="outline" className="rounded-full bg-white lg:hidden" />}>
                <Menu className="size-4" />
                Assets
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Decorations</SheetTitle>
                </SheetHeader>
                {assetPanel}
              </SheetContent>
            </Sheet>
            <Sheet open={mobilePropertiesOpen} onOpenChange={setMobilePropertiesOpen}>
              <SheetTrigger render={<Button variant="outline" className="rounded-full bg-white xl:hidden" />}>
                <Sparkles className="size-4" />
                Edit
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Properties</SheetTitle>
                </SheetHeader>
                {propertiesPanel}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <div className="hidden min-h-0 lg:block">{assetPanel}</div>
          <div className="flex min-h-0 flex-col">
            <EditorToolbar
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={undo}
              onRedo={redo}
              onReset={reset}
              onSave={saveDraft}
              onPreview={() => setPreviewOpen(true)}
            />
            <div className="border-b border-[var(--dotti-border)] bg-white/55 px-4 py-3 sm:hidden">
              <BaseShapeSelector value={design.baseShape} onChange={updateBaseShape} />
            </div>
            <DesignCanvas
              baseShape={design.baseShape}
              elements={design.elements}
              selectedElementId={selectedElementId}
              onSelect={setSelectedElementId}
              onDropAsset={(assetId, x, y) => {
                const asset = dottiAssets.find((item) => item.id === assetId);
                if (asset) addAsset(asset, x, y);
              }}
              onChangeElement={changeElement}
            />
          </div>
          <div className="hidden min-h-0 xl:block">{propertiesPanel}</div>
        </div>
      </section>

      <VIPAssetModal open={vipModalOpen} onOpenChange={setVipModalOpen} />
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        baseShape={design.baseShape}
        elements={design.elements}
      />
      <RestoreDraftModal open={restoreOpen} onStartNew={startNew} onRestore={restoreDraft} />
    </main>
  );
}
