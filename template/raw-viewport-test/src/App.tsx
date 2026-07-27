import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { ToastContainer, type ToastMessage } from '@/components/ui/toast';

type ViewportFitMode = 'cover' | 'contain' | 'auto';
type InteractiveWidgetMode = 'resizes-content' | 'resizes-visual' | 'overlays-content' | 'none';
type HeightUnitMode = '100%' | '100dvh' | '100vh' | '100svh' | '100lvh';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialFit = (urlParams.get('fit') as ViewportFitMode) || 'cover';
  const initialWidget = (urlParams.get('widget') as InteractiveWidgetMode) || 'resizes-content';
  const initialUnit = (urlParams.get('unit') as HeightUnitMode) || '100dvh';

  const [viewportFit, setViewportFit] = useState<ViewportFitMode>(initialFit);
  const [interactiveWidget, setInteractiveWidget] = useState<InteractiveWidgetMode>(initialWidget);
  const [heightUnit, setHeightUnit] = useState<HeightUnitMode>(initialUnit);
  const [showDangerOverlay, setShowDangerOverlay] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: 'default' | 'success' | 'warning' = 'default') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [metrics, setMetrics] = useState({
    windowHeight: 0,
    visualHeight: 0,
    unitPx: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const heightUnitRef = useRef(heightUnit);
  useEffect(() => { heightUnitRef.current = heightUnit; }, [heightUnit]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const measureUnitPx = () => {
    const unit = heightUnitRef.current; // e.g. '100dvh'
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:0;left:0;width:1px;height:${unit};visibility:hidden;pointer-events:none;`;
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

    const rafId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(rafId);
  }, [interactiveWidget, updateMetrics, viewportFit]);

  useEffect(() => {
    let frameId = 0;
    const scheduleMetricsUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateMetrics);
    };

    window.addEventListener('resize', scheduleMetricsUpdate);
    window.visualViewport?.addEventListener('resize', scheduleMetricsUpdate);
    window.visualViewport?.addEventListener('scroll', scheduleMetricsUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', scheduleMetricsUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleMetricsUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleMetricsUpdate);
    };
  }, [updateMetrics]);


  useEffect(() => {
    const handleGestureStart = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', handleGestureStart);
    return () => document.removeEventListener('gesturestart', handleGestureStart);
  }, []);

  // heightUnit이 바뀌면 해당 단위 px 재측정
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

  // SegmentedControl: 세그먼트 버튼 그룹 (viewport-fit / height unit / widget 공통)
  function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    cols,
  }: {
    options: { id: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    cols?: string;
  }) {
    return (
      <div className={cn('grid gap-1 bg-muted/80 p-1 rounded-xl border border-border/40 shadow-inner', cols ?? (options.length === 5 ? 'grid-cols-5' : options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'))}>
        {options.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'py-1 px-1 rounded-lg text-[10px] font-medium transition-all duration-150 cursor-pointer text-center whitespace-pre-line leading-tight flex items-center justify-center min-h-[32px]',
              value === id
                ? 'bg-background text-foreground font-semibold shadow-xs border border-border/50'
                : 'text-muted-foreground hover:text-foreground bg-transparent'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    /* ── [정석 아키텍처] App Shell ──
     * 뷰포트 고정(fixed, top, height)은 index.css의 #root에서 처리하며,
     * App 컴포넌트는 내부 Grid 레이아웃(auto minmax(0, 1fr) auto)만 관리함 */
    <div className="w-full h-full bg-background text-foreground font-sans grid grid-rows-[auto_minmax(0,1fr)_auto]">
      {/* 🔴 Notch Danger Zone Visualizer */}
      {showDangerOverlay && (
        <div
          className="absolute inset-x-0 top-0 z-50 pointer-events-none bg-red-500/20 border-b border-red-500/50 flex items-center justify-center text-[10px] text-red-500 font-bold tracking-wider"
          style={{ height: 'env(safe-area-inset-top, 0px)' }}
        >
          <span>NOTCH / STATUS BAR</span>
        </div>
      )}

      {/* 🔵 Home Bar Danger Zone Visualizer */}
      {showDangerOverlay && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 pointer-events-none bg-blue-500/20 border-t border-blue-500/50 flex items-center justify-center text-[10px] text-blue-500 font-bold tracking-wider"
          style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span>HOME BAR / NAVIGATION BAR</span>
        </div>
      )}

        {/* ── HEADER (Grid 행 1: 고정 상단 헤더) ── */}
        <header
          className="px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-md z-10"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground">Viewport Lab</h1>
            </div>
            <Badge variant="blue" className="font-mono text-xs shadow-2xs">{heightUnit.replace('100', '')}</Badge>
          </div>
        </header>

        {/* ── MAIN (Grid 행 2: 수축 및 스크롤 전용 영역) ──
         * min-h-0 과 min-w-0 이 있어야 Grid 부모 크기가 줄어들 때 함께 축소됨 */}
        <main
          className="min-w-0 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 space-y-3.5 bg-muted/20"
          style={{
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          {/* 카드 1: Screen & Safe Area Control */}
          <Card className="shadow-2xs rounded-2xl border-border/60">
            <CardContent className="p-4 space-y-3.5">
              {/* 회전 단축키 안내 */}
              <div className="flex items-center justify-between text-xs bg-muted/50 p-2.5 rounded-xl border border-border/30">
                <span className="font-medium text-muted-foreground">🔄 화면 회전 단축키</span>
                <kbd className="px-2 py-0.5 bg-background border border-border/60 rounded-md font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                  ⌘ + ⬅️ / ➡️
                </kbd>
              </div>

              {/* viewport-fit */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">viewport-fit</div>
                <SegmentedControl
                  options={(['cover', 'contain', 'auto'] as ViewportFitMode[]).map(m => ({ id: m, label: m }))}
                  value={viewportFit}
                  onChange={changeViewportFit}
                />
              </div>

              {/* Danger Zone toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">Danger Zone Overlay</span>
                <Button
                  size="pill"
                  variant={showDangerOverlay ? 'default' : 'secondary'}
                  onClick={() => setShowDangerOverlay(!showDangerOverlay)}
                  className="px-3 py-1 text-xs font-semibold"
                >
                  {showDangerOverlay ? 'ON' : 'OFF'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 카드 2: Height Unit Control */}
          <Card className="shadow-2xs rounded-2xl border-border/60">
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-semibold text-foreground">Height Unit</div>
              <SegmentedControl
                options={(['100%', '100dvh', '100vh', '100svh', '100lvh'] as HeightUnitMode[]).map(u => ({ id: u, label: u }))}
                value={heightUnit}
                onChange={changeHeightUnit}
              />
            </CardContent>
          </Card>

          {/* 카드 3: Virtual Keyboard Control */}
          <Card className="shadow-2xs rounded-2xl border-border/60">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">⌨️ 가상 키보드 토글</span>
                <span className="text-[11px] text-muted-foreground font-mono">iOS: ⌘+K</span>
              </div>

              <Button id="btn-focus-input" size="lg" onClick={focusInput} className="w-full justify-center font-medium rounded-xl">
                ⌨️ 버튼 클릭으로 입력창 포커스하기
              </Button>

              <div className="space-y-1.5 pt-1 border-t border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">interactive-widget</span>
                  <Badge variant="green" className="text-[10px] px-1.5 py-0.2">AOS 전용</Badge>
                </div>
                <SegmentedControl
                  options={[
                    { id: 'resizes-content' as InteractiveWidgetMode, label: 'resizes-\ncontent' },
                    { id: 'resizes-visual' as InteractiveWidgetMode, label: 'resizes-\nvisual' },
                    { id: 'overlays-content' as InteractiveWidgetMode, label: 'overlays-\ncontent' },
                    { id: 'none' as InteractiveWidgetMode, label: 'none' },
                  ]}
                  value={interactiveWidget}
                  onChange={changeInteractiveWidget}
                />
              </div>
            </CardContent>
          </Card>

          {/* 카드 4: Shadcn Overlay & Dialog Portal Test */}
          <Card className="shadow-2xs rounded-2xl border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">✨ Shadcn Overlay / Portal 테스트</span>
                <Badge variant="blue" className="text-[10px]">fixed inset-0 검증</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                position: fixed 세팅에서 다이얼로그 모달 및 포털 알림 토스트가 뷰포트 내에 정상 조율되는지 테스트합니다.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full text-xs font-medium rounded-xl justify-center"
                >
                  💬 Dialog 모달 열기
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addToast('Shadcn Toast 테스트', 'fixed inset-0 환경에서 포털 오버레이 정상 발동!', 'success')}
                  className="w-full text-xs font-medium rounded-xl justify-center"
                >
                  🔔 Toast 알림 띄우기
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* ── FOOTER (Grid 행 3: 하단 입력창 Composer) ──
         * position: fixed 및 키보드 오프셋 계산을 제거하고,
         * 앱 셸의 3번째 행으로서 키보드 바로 위에 자연스럽게 배치됨 */}
        <footer className="border-t border-border/50 bg-background/95 backdrop-blur-md">
          {/* 📐 실시간 뷰포트 측정 현황판 */}
          <div
            className="p-3 border-b border-border/30 space-y-2"
            style={{
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
            }}
          >
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-muted/40 p-2.5 rounded-xl border border-border/30">
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground font-sans">window (layout)</div>
                <div className="font-semibold text-foreground">{metrics.windowHeight}px</div>
              </div>
              <div className="space-y-0.5 border-x border-border/40 px-1">
                <div className="text-[10px] text-muted-foreground font-sans">visual</div>
                <div className="font-semibold text-foreground">{metrics.visualHeight}px</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-muted-foreground font-sans">단위 계산</div>
                <div className="font-semibold text-foreground">{metrics.unitPx}px</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono text-[11px]">
              <div>
                <span>위젯: </span>
                <strong className="text-foreground">{interactiveWidget}</strong>
              </div>
              <div>
                <span>높이: </span>
                <strong className="text-foreground">{heightUnit.replace('100', '')}</strong>
              </div>
            </div>
          </div>

          {/* 입력창 */}
          <div
            className="flex items-center gap-2 p-3"
            style={{
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* font-size: 16px (text-[16px]) 지정으로 iOS Safari 자동 확대(Focus Zoom) 원천 차단 */}
            <input
              ref={inputRef}
              type="text"
              placeholder="터치하여 가상 키보드 테스트..."
              className="flex-1 bg-muted/40 border border-input rounded-xl px-3.5 py-2 text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </footer>

      {/* Shadcn Dialog Portal */}
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

      {/* Shadcn Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
