'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Sparkles } from 'lucide-react';

import { AssetSidebar } from '@/components/diy/asset-sidebar';
import { BackgroundSelector } from '@/components/diy/background-selector';
import { BaseColorSelector } from '@/components/diy/base-color-selector';
import { BaseShapeSelector } from '@/components/diy/base-shape-selector';
import { ConnectionMethodStep, productConnectionLabels } from '@/components/diy/connection-method-step';
import { CANVAS_HEIGHT, CANVAS_WIDTH, DesignCanvas } from '@/components/diy/design-canvas';
import { EditorToolbar } from '@/components/diy/editor-toolbar';
import { PreviewModal } from '@/components/diy/preview-modal';
import { PricePanel } from '@/components/diy/price-panel';
import { RestoreDraftModal } from '@/components/diy/restore-draft-modal';
import { VIPAssetModal } from '@/components/diy/vip-asset-modal';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { pricedDottiAssets } from '@/data/assets';
import { galleryDesigns } from '@/data/mock-commerce';
import { dottiApi, fileToDataUrl } from '@/lib/dotti-api';
import { defaultBackground } from '@/lib/backgrounds';
import { calculateDesignPrice, defaultPricingConfig } from '@/lib/pricing';
import type { AdminAssetRow, DottiUser, PricingConfig } from '@/types/commerce';
import type { AssetCategory, BaseCustomShape, BaseShape, BaseSize, DesignElement, DesignState, DottiAsset, ProductConnectionMethod } from '@/types/dotti';

const STORAGE_KEY = 'dotti-design-draft-v1';
const DEFAULT_BASE_COLOR = '#f8eee5';
const DEFAULT_FREE_SHAPE: BaseCustomShape = {
  width: 64,
  height: 58,
  radius: 22,
  rotation: 0,
};

const assetCategoriesSet = new Set<AssetCategory>([
  'Flowers',
  'Hearts',
  'Stars',
  'Animals',
  'Letters',
  'Fruits',
  'Food',
  'Ribbons',
  'Leaves',
  'Faces',
  'Seasonal',
  'Shapes',
]);

const officialAssetFromAdmin = (asset: AdminAssetRow): DottiAsset | null => {
  if (!assetCategoriesSet.has(asset.category as AssetCategory)) return null;
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category as AssetCategory,
    imageUrl: asset.imageUrl,
    isVIP: asset.isVIP,
    productionPrice: asset.productionPrice,
    source: asset.source,
    colorEditable: asset.colorEditable,
  };
};

const createInitialDesign = (): DesignState => ({
  name: 'Untitled Felti Brooch',
  baseShape: 'circle',
  baseSize: 'M',
  baseColor: DEFAULT_BASE_COLOR,
  baseCustomShape: DEFAULT_FREE_SHAPE,
  customBaseUrl: null,
  customBaseAspectRatio: null,
  decorationsDetachable: false,
  decorationConnectionMethod: null,
  detachableFee: 0,
  productConnectionMethod: null,
  finalPrice: undefined,
  background: defaultBackground,
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  elements: [],
});

const isLetterAsset = (asset?: DottiAsset) => asset?.category === 'Letters';

const getElementLetter = (element: DesignElement) =>
  element.assetName.replace('Letter ', '').trim() || element.assetId.replace('letter-', '').toUpperCase();

const enrichElement = (element: DesignElement): DesignElement => {
  const asset = pricedDottiAssets.find((item) => item.id === element.assetId);
  const colorEditable = element.source !== 'upload' && isLetterAsset(asset);
  const defaultColor = asset?.defaultColor?.toLowerCase();
  const existingColor = element.color?.toLowerCase();
  return {
    ...element,
    colorEditable,
    color: colorEditable && existingColor && existingColor !== defaultColor ? element.color : undefined,
  };
};

const completeDesign = (design: DesignState): DesignState => ({
  ...createInitialDesign(),
  ...design,
  baseColor: design.baseColor ?? DEFAULT_BASE_COLOR,
  baseCustomShape: design.baseCustomShape ?? DEFAULT_FREE_SHAPE,
  customBaseAspectRatio: design.customBaseAspectRatio ?? null,
  decorationsDetachable: Boolean(design.decorationsDetachable),
  decorationConnectionMethod: design.decorationsDetachable ? 'velcro' : null,
  detachableFee: design.detachableFee ?? 0,
  productConnectionMethod: design.productConnectionMethod ?? null,
  background: design.background ?? defaultBackground,
  elements: (design.elements ?? []).map(enrichElement),
});

const normalizeLayers = (elements: DesignElement[]) =>
  [...elements]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((element, index) => ({ ...element, zIndex: index + 1 }));

const loadImageAspectRatio = (imageUrl: string) =>
  new Promise<number>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Could not read image size.'));
        return;
      }
      resolve(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => reject(new Error('Could not read image size.'));
    image.src = imageUrl;
  });

const getCustomBaseSvgBox = (aspectRatio = 1) => {
  const maxWidth = 420;
  const maxHeight = 390;
  const safeRatio = Math.max(0.2, Math.min(5, aspectRatio || 1));
  let width = maxWidth;
  let height = width / safeRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeRatio;
  }

  return {
    x: (CANVAS_WIDTH - width) / 2,
    y: (CANVAS_HEIGHT - height) / 2 - 12,
    width,
    height,
  };
};

export function DIYStudio() {
  const [design, setDesign] = useState<DesignState>(createInitialDesign);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignState[]>([createInitialDesign()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'All'>('All');
  const [assetFilter, setAssetFilter] = useState<'All' | 'Free' | 'VIP' | 'Recently used' | 'Favorites'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<DottiUser | null>(null);
  const [uploads, setUploads] = useState<DottiAsset[]>([]);
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricingConfig);
  const [officialLibrary, setOfficialLibrary] = useState<DottiAsset[]>(pricedDottiAssets);
  const [step, setStep] = useState<'design' | 'connection'>('design');
  const [productConnectionMethod, setProductConnectionMethod] = useState<ProductConnectionMethod>('pin');
  const [connectionDesign, setConnectionDesign] = useState<DesignState | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { user } = await dottiApi.me();
        setUser(user);
        if (user?.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin')) {
          const { uploads } = await dottiApi.listUploads();
          setUploads(uploads);
        } else {
          setUploads([]);
        }
      } catch {
        setUser(null);
        setUploads([]);
      }
    };
    void loadUserData();
    const reloadUserData = () => void loadUserData();
    window.addEventListener('dotti-storage', reloadUserData);
    dottiApi.getPricing().then(({ pricing }) => setPricing(pricing)).catch(() => setPricing(defaultPricingConfig));
    dottiApi.listOfficialAssets().then(({ assets }) => {
      const library = assets.map(officialAssetFromAdmin).filter(Boolean) as DottiAsset[];
      if (library.length) setOfficialLibrary(library);
    }).catch(() => setOfficialLibrary(pricedDottiAssets));

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRestoreOpen(true);
    const params = new URLSearchParams(window.location.search);
    const designId = params.get('design');
    if (designId) {
      dottiApi.getDesign(designId).then(({ design }) => {
        const complete = completeDesign(design);
        setDesign(complete);
        setHistory([complete]);
        setHistoryIndex(0);
      }).catch(() => setLoginModalOpen(true));
      return () => window.removeEventListener('dotti-storage', reloadUserData);
    }
    const templateId = params.get('template');
    const template = galleryDesigns.find((item) => item.id === templateId);
    if (template) {
      const templateElements = template.assetIds
        .map((assetId, index) => pricedDottiAssets.find((asset) => asset.id === assetId) && {
          id: `${assetId}-${crypto.randomUUID()}`,
          assetId,
          assetName: pricedDottiAssets.find((asset) => asset.id === assetId)!.name,
          imageUrl: pricedDottiAssets.find((asset) => asset.id === assetId)!.imageUrl,
          x: 220 + index * 70,
          y: 205 + (index % 2) * 70,
          width: 92,
          height: 92,
          rotation: index * 12 - 8,
          zIndex: index + 1,
          flipX: false,
          flipY: false,
          productionPrice: pricedDottiAssets.find((asset) => asset.id === assetId)!.productionPrice ?? 8,
          source: pricedDottiAssets.find((asset) => asset.id === assetId)!.source ?? 'dotti',
          colorEditable: isLetterAsset(pricedDottiAssets.find((asset) => asset.id === assetId)),
        })
        .filter(Boolean) as DesignElement[];
      const next = { ...createInitialDesign(), name: `${template.title} Copy`, elements: templateElements };
      setDesign(next);
      setHistory([next]);
      setHistoryIndex(0);
    }
    return () => window.removeEventListener('dotti-storage', reloadUserData);
  }, []);

  const selectedElement = useMemo(
    () => design.elements.find((element) => element.id === selectedElementId),
    [design.elements, selectedElementId],
  );
  const canUseVIP = user?.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin');
  const officialAssets = useMemo(
    () =>
      officialLibrary.map((asset) => ({
        ...asset,
        productionPrice: asset.source === 'premium' || asset.isVIP ? pricing.premiumDecoration : pricing.standardDecoration,
      })),
    [officialLibrary, pricing],
  );
  const allAssets = useMemo(
    () => [...officialAssets, ...uploads.map((asset) => ({ ...asset, productionPrice: pricing.customDecoration }))],
    [officialAssets, pricing.customDecoration, uploads],
  );

  const capturePreview = (nextDesign: DesignState) => {
    const bg = nextDesign.background ?? defaultBackground;
    const baseColor = nextDesign.baseColor ?? DEFAULT_BASE_COLOR;
    const escapeAttr = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    const backgroundLayer =
      bg.type === 'upload' && bg.imageUrl
        ? `<rect width="100%" height="100%" fill="${bg.color}"/><image href="${bg.imageUrl}" x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" preserveAspectRatio="xMidYMid slice" opacity="0.82"/>`
        : `<rect width="100%" height="100%" fill="${bg.color || '#fffdf9'}"/>`;
    const freeShape = nextDesign.baseCustomShape ?? DEFAULT_FREE_SHAPE;
    const freeWidth = CANVAS_WIDTH * (freeShape.width / 100);
    const freeHeight = CANVAS_HEIGHT * (freeShape.height / 100);
    const freeX = (CANVAS_WIDTH - freeWidth) / 2;
    const freeY = (CANVAS_HEIGHT - freeHeight) / 2 - 22;
    const freeRadius = Math.min(freeWidth, freeHeight) * (freeShape.radius / 100);
    const base =
      nextDesign.customBaseUrl
        ? (() => {
            const box = getCustomBaseSvgBox(nextDesign.customBaseAspectRatio ?? 1);
            return `<image href="${escapeAttr(nextDesign.customBaseUrl ?? '')}" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" preserveAspectRatio="xMidYMid meet"/>`;
          })()
        : nextDesign.baseShape === 'heart'
          ? `<path d="M360 395S235 320 235 220c0-50 35-84 80-84 25 0 39 12 45 31 7-19 24-31 50-31 45 0 75 34 75 84 0 100-125 175-125 175Z" fill="${baseColor}" stroke="#eaded4" stroke-width="4"/>`
          : nextDesign.baseShape === 'square'
            ? `<rect x="160" y="90" width="400" height="400" rx="82" fill="${baseColor}" stroke="#eaded4" stroke-width="4"/>`
            : nextDesign.baseShape === 'free'
              ? `<rect x="${freeX}" y="${freeY}" width="${freeWidth}" height="${freeHeight}" rx="${freeRadius}" fill="${baseColor}" stroke="#eaded4" stroke-width="4" transform="rotate(${freeShape.rotation} 360 258)"/>`
              : `<ellipse cx="360" cy="270" rx="${nextDesign.baseShape === 'oval' ? 230 : 180}" ry="${nextDesign.baseShape === 'oval' ? 140 : 180}" fill="${baseColor}" stroke="#eaded4" stroke-width="4"/>`;
    const elements = [...nextDesign.elements]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((element, index) => {
        const transform = `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2}) scale(${element.flipX ? -1 : 1} ${element.flipY ? -1 : 1})`;
        if (element.color && element.source !== 'upload' && isLetterAsset(pricedDottiAssets.find((asset) => asset.id === element.assetId))) {
          const centerX = element.x + element.width / 2;
          const centerY = element.y + element.height / 2;
          const flip = `scale(${element.flipX ? -1 : 1} ${element.flipY ? -1 : 1})`;
          return `<g transform="rotate(${element.rotation} ${centerX} ${centerY}) translate(${element.x} ${element.y}) ${flip}"><text x="${element.width / 2}" y="${element.height * 0.75}" font-family="'Arial Rounded MT Bold', 'Nunito Sans', Arial, sans-serif" font-size="${element.height * 0.82}" font-weight="900" text-anchor="middle" fill="${element.color}">${escapeAttr(getElementLetter(element))}</text></g>`;
        }
        return `<image href="${escapeAttr(element.imageUrl)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" transform="${transform}"/>`;
      })
      .join('');
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">${backgroundLayer}${base}${elements}</svg>`)}`;
  };

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
    if (asset.isVIP && !canUseVIP) {
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
      productionPrice: asset.productionPrice ?? (asset.isVIP ? 15 : 8),
      source: asset.source ?? (asset.isVIP ? 'premium' : 'dotti'),
      colorEditable: asset.source !== 'upload' && isLetterAsset(asset),
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
    commitDesign({ ...design, baseShape, customBaseUrl: null, customBaseAspectRatio: null });
  };

  const updateBaseSize = (baseSize: BaseSize) => {
    commitDesign({ ...design, baseSize });
  };

  const updateBaseColor = (baseColor: string) => {
    commitDesign({ ...design, baseColor });
  };

  const updateFreeShape = (baseCustomShape: BaseCustomShape) => {
    commitDesign({ ...design, baseShape: 'free', baseCustomShape, customBaseUrl: null, customBaseAspectRatio: null });
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
    if (!window.confirm('Reset your Felti design?')) return;
    commitDesign({ ...design, elements: [] });
    setSelectedElementId(null);
  };

  const saveDraft = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const previewImage = capturePreview(design);
    const price = calculateDesignPrice(design, pricing);
    dottiApi.saveDesign({
      ...design,
      previewImage,
      decorationConnectionMethod: design.decorationsDetachable ? 'velcro' : null,
      detachableFee: price.detachableFee,
      finalPrice: price.total,
    }).then(({ design }) => {
      setDesign(design);
      setHistory([design]);
      setHistoryIndex(0);
      alert('Design saved.');
    }).catch((event) => alert(event instanceof Error ? event.message : 'Could not save design.'));
  };

  const downloadDesign = () => {
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${design.name.toLowerCase().replaceAll(' ', '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const goToConnectionStep = () => {
    const previewImage = capturePreview(design);
    const nextDesign = { ...design, previewImage };
    setConnectionDesign(nextDesign);
    setDesignWithoutHistory(nextDesign);
    setProductConnectionMethod(design.productConnectionMethod ?? productConnectionMethod);
    setStep('connection');
    setPreviewOpen(false);
  };

  const orderDesign = async () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    const orderSourceDesign = connectionDesign ?? design;
    const previewImage = orderSourceDesign.previewImage ?? capturePreview(orderSourceDesign);
    const price = calculateDesignPrice(orderSourceDesign, pricing);
    const configuredDesign: DesignState = {
      ...orderSourceDesign,
      previewImage,
      decorationsDetachable: Boolean(orderSourceDesign.decorationsDetachable),
      decorationConnectionMethod: orderSourceDesign.decorationsDetachable ? 'velcro' : null,
      detachableFee: price.detachableFee,
      productConnectionMethod,
      finalPrice: price.total,
    };
    const { design: saved } = await dottiApi.saveDesign(configuredDesign);
    await dottiApi.addCart({
      designId: saved.id,
      productName: design.name || 'Custom Felti Design',
      price: price.total,
      quantity: 1,
      baseSize: price.baseSize,
      baseShape: saved.baseShape,
      baseColor: saved.baseColor,
      decorationCount: price.decorationCount,
      decorationsDetachable: Boolean(saved.decorationsDetachable),
      decorationConnectionMethod: saved.decorationsDetachable ? 'Velcro' : null,
      detachableFee: price.detachableFee,
      productConnectionMethod: productConnectionLabels[productConnectionMethod],
      previewImage,
      designSnapshot: { ...saved, previewImage, finalPrice: price.total },
    });
    window.location.href = '/cart';
  };

  const confirmUploadComplexity = () =>
    window.confirm(
      'Keep your design simple.\n\nPlease avoid overly complex images. Simple shapes, clear outlines, few colors, and large recognizable details work best for handmade felt production.\n\nI understand that complex images may need to be simplified for felt production.',
    );

  const requestBaseUpload = () => {
    if (!canUseVIP) {
      setVipModalOpen(true);
      return;
    }
    if (confirmUploadComplexity()) document.getElementById('dotti-base-upload')?.click();
  };

  const requestDecorationUpload = () => {
    if (!canUseVIP) {
      setVipModalOpen(true);
      return;
    }
    if (confirmUploadComplexity()) document.getElementById('dotti-decoration-upload')?.click();
  };

  const uploadBaseInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!canUseVIP) {
      setVipModalOpen(true);
      return;
    }
    try {
      const imageUrl = await fileToDataUrl(file);
      const aspectRatio = await loadImageAspectRatio(imageUrl);
      const { upload } = await dottiApi.uploadBase({ name: file.name, imageUrl });
      commitDesign({
        ...design,
        baseShape: 'custom',
        customBaseUrl: upload.imageUrl,
        customBaseAspectRatio: aspectRatio,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    }
  };

  const uploadDecorationInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!canUseVIP) {
      setVipModalOpen(true);
      return;
    }
    try {
      const imageUrl = await fileToDataUrl(file);
      const { upload } = await dottiApi.uploadAsset({ name: file.name.replace(/\.[^.]+$/, ''), imageUrl });
      setUploads((current) => [upload, ...current]);
      setAssetFilter('Recently used');
      setSelectedCategory('All');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    }
  };

  const deleteUploadAsset = async (asset: DottiAsset) => {
    if (!window.confirm(`Delete "${asset.name}" from My Uploads?`)) return;
    await dottiApi.deleteUpload(asset.id);
    setUploads((current) => current.filter((item) => item.id !== asset.id));
    if (design.elements.some((element) => element.assetId === asset.id)) {
      commitDesign({
        ...design,
        elements: normalizeLayers(design.elements.filter((element) => element.assetId !== asset.id)),
      });
      if (selectedElement?.assetId === asset.id) setSelectedElementId(null);
    }
  };

  const uploadBackgroundInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!canUseVIP) {
      setVipModalOpen(true);
      return;
    }
    try {
      const imageUrl = await fileToDataUrl(file);
      await dottiApi.uploadBackground({ name: `Background ${file.name}`, imageUrl });
      commitDesign({
        ...design,
        background: {
          type: 'upload',
          color: design.background?.color ?? defaultBackground.color,
          pattern: 'plain',
          imageUrl,
        },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    }
  };

  const restoreDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const restored = completeDesign(JSON.parse(saved) as DesignState);
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

  useEffect(() => {
    if (!design.customBaseUrl || design.customBaseAspectRatio) return;
    let cancelled = false;
    loadImageAspectRatio(design.customBaseUrl)
      .then((aspectRatio) => {
        if (!cancelled) setDesignWithoutHistory({ ...design, customBaseAspectRatio: aspectRatio });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [design]);

  const assetPanel = (
    <AssetSidebar
      selectedCategory={selectedCategory}
      searchTerm={searchTerm}
      onCategoryChange={setSelectedCategory}
      assetFilter={assetFilter}
      onAssetFilterChange={setAssetFilter}
      onSearchChange={setSearchTerm}
      onAddAsset={addAsset}
      canUseVIP={!!canUseVIP}
      uploads={uploads}
      onLockedVIP={() => setVipModalOpen(true)}
      onUploadDecoration={requestDecorationUpload}
      onDeleteUpload={(asset) => void deleteUploadAsset(asset)}
    />
  );

  const pricePanel = (
    <PricePanel
      design={design}
      pricing={pricing}
      onNext={goToConnectionStep}
      onToggleDetachable={(decorationsDetachable) =>
        commitDesign({
          ...design,
          decorationsDetachable,
          decorationConnectionMethod: decorationsDetachable ? 'velcro' : null,
        })
      }
    />
  );
  const backgroundControl = (
    <BackgroundSelector
      value={design.background ?? defaultBackground}
      canUseVIP={!!canUseVIP}
      onChange={(background) => commitDesign({ ...design, background })}
      onUpload={() => document.getElementById('dotti-background-upload')?.click()}
      onLockedVIP={() => setVipModalOpen(true)}
    />
  );

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />
      <input id="dotti-base-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadBaseInput} />
      <input id="dotti-decoration-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadDecorationInput} />
      <input id="dotti-background-upload" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadBackgroundInput} />
      {step === 'connection' ? (
        <ConnectionMethodStep
          design={connectionDesign ?? design}
          pricing={pricing}
          selected={productConnectionMethod}
          onSelect={setProductConnectionMethod}
          onBack={() => {
            setConnectionDesign(null);
            setStep('design');
          }}
          onConfirm={() => void orderDesign()}
        />
      ) : (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="diy-subheader flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--dotti-border)] bg-white/70 px-4 py-2">
          <div>
            <a href="/" className="text-sm font-bold text-[var(--dotti-muted)] hover:text-[var(--dotti-ink)]">
              Felti
            </a>
            <h1 className="text-2xl font-black">DIY Design Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <BaseShapeSelector
                value={design.baseShape}
                size={design.baseSize}
                freeShape={design.baseCustomShape ?? DEFAULT_FREE_SHAPE}
                canUseVIP={!!canUseVIP}
                onChange={updateBaseShape}
                onSizeChange={updateBaseSize}
                onFreeShapeChange={updateFreeShape}
                onUploadBase={requestBaseUpload}
              />
            </div>
            <div className="hidden sm:block">
              <BaseColorSelector value={design.baseColor ?? DEFAULT_BASE_COLOR} onChange={updateBaseColor} />
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
                Price
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Your Design</SheetTitle>
                </SheetHeader>
                {pricePanel}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[22%_minmax(0,1fr)] xl:grid-cols-[22%_minmax(0,53%)_25%]">
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
              onDownload={downloadDesign}
              onNext={goToConnectionStep}
              backgroundControl={backgroundControl}
            />
            <div className="border-b border-[var(--dotti-border)] bg-white/55 px-4 py-3 sm:hidden">
              <BaseShapeSelector
                value={design.baseShape}
                size={design.baseSize}
                freeShape={design.baseCustomShape ?? DEFAULT_FREE_SHAPE}
                canUseVIP={!!canUseVIP}
                onChange={updateBaseShape}
                onSizeChange={updateBaseSize}
                onFreeShapeChange={updateFreeShape}
                onUploadBase={requestBaseUpload}
              />
              <div className="mt-2">
                <BaseColorSelector value={design.baseColor ?? DEFAULT_BASE_COLOR} onChange={updateBaseColor} />
              </div>
            </div>
            <DesignCanvas
              baseShape={design.baseShape}
              baseColor={design.baseColor ?? DEFAULT_BASE_COLOR}
              baseCustomShape={design.baseCustomShape ?? DEFAULT_FREE_SHAPE}
              background={design.background}
              customBaseUrl={design.customBaseUrl}
              customBaseAspectRatio={design.customBaseAspectRatio}
              elements={design.elements}
              selectedElementId={selectedElementId}
              onSelect={setSelectedElementId}
              onDropAsset={(assetId, x, y) => {
                const asset = allAssets.find((item) => item.id === assetId);
                if (asset) addAsset(asset, x, y);
              }}
              onChangeElement={changeElement}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onLayer={changeLayer}
              onFlip={flipSelected}
            />
          </div>
          <div className="hidden min-h-0 xl:block">{pricePanel}</div>
        </div>
      </section>
      )}

      <VIPAssetModal open={vipModalOpen} onOpenChange={setVipModalOpen} />
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="rounded-[28px] border-[var(--dotti-border)] bg-[var(--dotti-bg)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Log in to keep creating</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-[var(--dotti-muted)]">
            Save designs, upload personal assets, and order custom Felti pieces with your account.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-full bg-white" onClick={() => setLoginModalOpen(false)}>
              Maybe Later
            </Button>
            <Button render={<a href={`/login?returnTo=${encodeURIComponent('/diy')}`} />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
              Log In / Sign Up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        baseShape={design.baseShape}
        baseColor={design.baseColor ?? DEFAULT_BASE_COLOR}
        baseCustomShape={design.baseCustomShape ?? DEFAULT_FREE_SHAPE}
        background={design.background}
        customBaseUrl={design.customBaseUrl}
        customBaseAspectRatio={design.customBaseAspectRatio}
        elements={design.elements}
        onOrder={goToConnectionStep}
      />
      <RestoreDraftModal open={restoreOpen} onStartNew={startNew} onRestore={restoreDraft} />
    </main>
  );
}
