import { useCallback, useEffect, useRef, useState } from 'react';
import { Content, type HeightUnitMode, type InteractiveWidgetMode, type ViewportFitMode } from '@/components/layout/Content';
import { DangerZoneOverlay } from '@/components/layout/DangerZoneOverlay';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Dialog } from '@/components/ui/dialog';
import { ToastContainer, type ToastMessage } from '@/components/ui/toast';

import { detectEnvironment } from '@/lib/browser';

import { useVisualViewport } from '@/hooks/useVisualViewport';

export default function App() {
  useVisualViewport();
  const env = detectEnvironment();
  const urlParams = new URLSearchParams(window.location.search);
  const initialFit = (urlParams.get('fit') as ViewportFitMode) || 'cover';
  const initialWidget = (urlParams.get('widget') as InteractiveWidgetMode) || (env.os === 'Android' ? 'resizes-content' : 'resizes-content');
  const initialUnit = (urlParams.get('unit') as HeightUnitMode) || '100%';

  const [viewportFit, setViewportFit] = useState<ViewportFitMode>(initialFit);
  const [interactiveWidget, setInteractiveWidget] = useState<InteractiveWidgetMode>(initialWidget);
  const [heightUnit, setHeightUnit] = useState<HeightUnitMode>(initialUnit);
  const [showDangerOverlay, setShowDangerOverlay] = useState<boolean>(true);
  const initialDialogOpen = urlParams.get('dialog') === 'open';
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(initialDialogOpen);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: 'default' | 'success' | 'warning' = 'default') => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [metrics, setMetrics] = useState({
    windowHeight: 0,
    visualHeight: 0,
    unitPx: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const heightUnitRef = useRef(heightUnit);
  useEffect(() => {
    heightUnitRef.current = heightUnit;
  }, [heightUnit]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const measureUnitPx = () => {
    const unit = heightUnitRef.current;
    const cssHeight = unit === '100%' ? 'var(--spacing-app-height, 100dvh)' : unit;
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:0;left:0;width:1px;height:${cssHeight};visibility:hidden;pointer-events:none;`;
    document.body.appendChild(el);
    const px = Math.round(el.getBoundingClientRect().height);
    document.body.removeChild(el);
    return px;
  };

  const updateMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;
    const winH = window.innerHeight;
    const vvH = vv ? vv.height : winH;

    setMetrics({
      windowHeight: winH,
      visualHeight: Math.round(vvH),
      unitPx: measureUnitPx(),
    });
  }, []);

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    const widgetStr = interactiveWidget !== 'none' ? `, interactive-widget=${interactiveWidget}` : '';
    meta.content = `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=${viewportFit}${widgetStr}`;
  }, [interactiveWidget, viewportFit]);

  useEffect(() => {
    updateMetrics();

    const handleResize = () => updateMetrics();
    window.addEventListener('resize', handleResize);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      }
    };
  }, [updateMetrics]);

  useEffect(() => {
    const handleGestureStart = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', handleGestureStart);
    return () => document.removeEventListener('gesturestart', handleGestureStart);
  }, []);

  useEffect(() => {
    updateMetrics();
  }, [heightUnit, updateMetrics]);

  const changeViewportFit = (mode: ViewportFitMode) => {
    setViewportFit(mode);
    const params = new URLSearchParams(window.location.search);
    params.set('fit', mode);
    window.history.replaceState(null, '', `?${params.toString()}`);
    window.location.reload();
  };

  const changeInteractiveWidget = (mode: InteractiveWidgetMode) => {
    setInteractiveWidget(mode);
    const params = new URLSearchParams(window.location.search);
    params.set('widget', mode);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const changeHeightUnit = (unit: HeightUnitMode) => {
    setHeightUnit(unit);
    const params = new URLSearchParams(window.location.search);
    params.set('unit', unit);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  return (
    <div
      className="app"
      style={{
        height: heightUnit === '100%' ? 'var(--spacing-app-height, 100dvh)' : heightUnit,
      }}
    >
      <DangerZoneOverlay show={showDangerOverlay} />

      <Header heightUnit={heightUnit} onOpenDialog={() => setIsDialogOpen(true)} />

      <Content
        viewportFit={viewportFit}
        onChangeViewportFit={changeViewportFit}
        showDangerOverlay={showDangerOverlay}
        onToggleDangerOverlay={() => setShowDangerOverlay(!showDangerOverlay)}
        heightUnit={heightUnit}
        onChangeHeightUnit={changeHeightUnit}
        interactiveWidget={interactiveWidget}
        onChangeInteractiveWidget={changeInteractiveWidget}
        onFocusInput={focusInput}
        onOpenDialog={() => setIsDialogOpen(true)}
        onAddToast={addToast}
      />

      <Footer
        inputRef={inputRef}
        metrics={metrics}
        interactiveWidget={interactiveWidget}
        heightUnit={heightUnit}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Shadcn Dialog Portal 테스트"
        description="position: fixed; inset: 0 세팅 환경에서 다이얼로그 모달이 뷰포트 정중앙에 정상 렌더링되는지 검증합니다."
      >
        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground">모달 내부 입력창 키보드 포커스 테스트</label>
          <input
            type="text"
            placeholder="다이얼로그 내부 텍스트 입력..."
            className="w-full bg-muted/30 border border-input rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Dialog>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
