import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '#/.generated/shadcn/components/ui';
import { AppShell } from '#/components/layout';

import { Content, type HeightUnitMode, type InteractiveWidgetMode, type ViewportFitMode } from './-components/Content';
import { Footer, type ViewportMetrics } from './-components/Footer';
import { Header } from './-components/Header';
import { HeightGuidelineOverlay } from './-components/HeightGuidelineOverlay';

export const Route = createFileRoute('/example/viewport/')({
  component: ViewportLabPage,
});

function ViewportLabPage() {
  const [viewportFit, setViewportFit] = useState<ViewportFitMode>('cover');
  const [interactiveWidget, setInteractiveWidget] = useState<InteractiveWidgetMode>('resizes-content');
  const [heightUnit, setHeightUnit] = useState<HeightUnitMode>('100%');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [metrics, setMetrics] = useState<ViewportMetrics>({
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
    const initialMeasureFrame = window.requestAnimationFrame(updateMetrics);

    const handleResize = () => updateMetrics();
    window.addEventListener('resize', handleResize);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleResize);
      vv.addEventListener('scroll', handleResize);
    }

    return () => {
      window.cancelAnimationFrame(initialMeasureFrame);
      window.removeEventListener('resize', handleResize);
      if (vv) {
        vv.removeEventListener('resize', handleResize);
        vv.removeEventListener('scroll', handleResize);
      }
    };
  }, [updateMetrics]);

  useEffect(() => {
    const handleGestureStart = (event: Event) => event.preventDefault();
    document.addEventListener('gesturestart', handleGestureStart);
    return () => document.removeEventListener('gesturestart', handleGestureStart);
  }, []);

  useEffect(() => {
    const heightUnitMeasureFrame = window.requestAnimationFrame(updateMetrics);

    return () => window.cancelAnimationFrame(heightUnitMeasureFrame);
  }, [heightUnit, updateMetrics]);

  const addToast = (title: string, description?: string, type: 'default' | 'success' | 'warning' = 'default') => {
    if (type === 'success') {
      toast.success(title, { description });
    }
    else if (type === 'warning') {
      toast.warning(title, { description });
    }
    else {
      toast(title, { description });
    }
  };

  const changeViewportFit = (mode: ViewportFitMode) => {
    setViewportFit(mode);
  };

  const changeInteractiveWidget = (mode: InteractiveWidgetMode) => {
    setInteractiveWidget(mode);
  };

  const changeHeightUnit = (unit: HeightUnitMode) => {
    setHeightUnit(unit);
  };

  return (
    <>
      <AppShell
        style={{
          height: heightUnit === '100%' ? 'var(--spacing-app-height, 100dvh)' : heightUnit,
        }}
      >
        <Header heightUnit={heightUnit} onOpenDialog={() => setIsDialogOpen(true)} />
        <Content
          viewportFit={viewportFit}
          onChangeViewportFit={changeViewportFit}
          heightUnit={heightUnit}
          onChangeHeightUnit={changeHeightUnit}
          interactiveWidget={interactiveWidget}
          onChangeInteractiveWidget={changeInteractiveWidget}
          onFocusInput={focusInput}
          onOpenDialog={() => setIsDialogOpen(true)}
          onAddToast={addToast}
        />
        <Footer inputRef={inputRef} metrics={metrics} interactiveWidget={interactiveWidget} heightUnit={heightUnit} />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Shadcn Dialog Portal 테스트</DialogTitle>
              <DialogDescription>
                position: fixed; inset: 0 세팅 환경에서 다이얼로그 모달이 뷰포트 정중앙에 정상 렌더링되는지 검증합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-foreground">모달 내부 입력창 키보드 포커스 테스트</Label>
              <Input
                type="text"
                placeholder="다이얼로그 내부 텍스트 입력..."
                className="bg-muted/30 text-xs"
              />
            </div>

            <DialogFooter>
              <DialogClose render={(
                <Button className="w-full rounded-xl font-semibold" />
              )}
              >
                확인 및 닫기
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
      <HeightGuidelineOverlay />
    </>
  );
}
