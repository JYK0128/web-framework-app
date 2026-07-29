import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';

export type ViewportFitMode = 'cover' | 'contain' | 'auto';
export type InteractiveWidgetMode = 'resizes-content' | 'resizes-visual' | 'overlays-content' | 'none';
export type HeightUnitMode = '100%' | '100dvh' | '100vh' | '100svh' | '100lvh';

export interface ContentProps {
  viewportFit: ViewportFitMode;
  onChangeViewportFit: (mode: ViewportFitMode) => void;
  showDangerOverlay: boolean;
  onToggleDangerOverlay: () => void;
  heightUnit: HeightUnitMode;
  onChangeHeightUnit: (unit: HeightUnitMode) => void;
  interactiveWidget: InteractiveWidgetMode;
  onChangeInteractiveWidget: (mode: InteractiveWidgetMode) => void;
  onFocusInput: () => void;
  onOpenDialog: () => void;
  onAddToast: (title: string, description?: string, type?: 'default' | 'success' | 'warning') => void;
}

export function Content({
  viewportFit,
  onChangeViewportFit,
  showDangerOverlay,
  onToggleDangerOverlay,
  heightUnit,
  onChangeHeightUnit,
  interactiveWidget,
  onChangeInteractiveWidget,
  onFocusInput,
  onOpenDialog,
  onAddToast,
}: ContentProps) {
  return (
    <main className="app-content scroll-y min-w-0 min-h-0 p-4 space-y-3.5 bg-muted/20">
      {/* 📌 콘텐츠 최상단 입력창 */}
      <div className="space-y-1">
        <label className="sr-only" htmlFor="content-top-input">콘텐츠 최상단 입력창</label>
        <input
          id="content-top-input"
          type="text"
          placeholder="📌 콘텐츠 최상단 입력창..."
          autoComplete="off"
          enterKeyHint="next"
          className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
        />
      </div>

      {/* 카드 1: Screen & Safe Area Control */}
      <Card className="shadow-2xs rounded-2xl border-border/60">
        <CardContent className="p-4 space-y-3.5">
          {/* 회전 단축키 안내 */}
          <div className="flex items-center justify-between text-xs bg-muted/50 p-2.5 rounded-xl border border-border/30">
            <span className="font-medium text-muted-foreground">🔄 화면 회전 단축키</span>
            <kbd className="px-2 py-0.5 bg-background border border-border/60 rounded-md font-mono text-xs font-semibold text-foreground shadow-2xs">
              ⌘ + ⬅️ / ➡️
            </kbd>
          </div>

          {/* viewport-fit */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-foreground">viewport-fit</div>
            <SegmentedControl
              options={(['cover', 'contain', 'auto'] as ViewportFitMode[]).map((m) => ({ id: m, label: m }))}
              value={viewportFit}
              onChange={onChangeViewportFit}
            />
          </div>

          {/* Danger Zone toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Danger Zone Overlay</span>
            <Button
              size="pill"
              variant={showDangerOverlay ? 'default' : 'secondary'}
              onClick={onToggleDangerOverlay}
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
            options={(['100%', '100dvh', '100vh', '100svh', '100lvh'] as HeightUnitMode[]).map((u) => ({
              id: u,
              label: u,
            }))}
            value={heightUnit}
            onChange={onChangeHeightUnit}
          />
        </CardContent>
      </Card>

      {/* 📌 콘텐츠 중간 입력창 */}
      <div className="space-y-1">
        <label className="sr-only" htmlFor="content-middle-input">콘텐츠 중간 입력창</label>
        <input
          id="content-middle-input"
          type="text"
          placeholder="📌 콘텐츠 중간 입력창..."
          autoComplete="off"
          enterKeyHint="next"
          className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
        />
      </div>

      {/* 카드 3: Virtual Keyboard Control */}
      <Card className="shadow-2xs rounded-2xl border-border/60">
        <CardContent className="p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">⌨️ 가상 키보드 토글</span>
            <span className="text-xs text-muted-foreground font-mono">iOS: ⌘+K</span>
          </div>

          <Button
            id="btn-focus-input"
            size="lg"
            onClick={onFocusInput}
            className="w-full justify-center font-medium rounded-xl"
          >
            ⌨️ 버튼 클릭으로 입력창 포커스하기
          </Button>

          <div className="space-y-1.5 pt-1 border-t border-border/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">interactive-widget</span>
              <Badge variant="green" className="text-xs px-1.5 py-0.5">
                AOS 전용
              </Badge>
            </div>
            <SegmentedControl
              options={[
                { id: 'resizes-content' as InteractiveWidgetMode, label: 'resizes-\ncontent' },
                { id: 'resizes-visual' as InteractiveWidgetMode, label: 'resizes-\nvisual' },
                { id: 'overlays-content' as InteractiveWidgetMode, label: 'overlays-\ncontent' },
                { id: 'none' as InteractiveWidgetMode, label: 'none' },
              ]}
              value={interactiveWidget}
              onChange={onChangeInteractiveWidget}
            />
          </div>
        </CardContent>
      </Card>

      {/* 📌 콘텐츠 중간하단 입력창 */}
      <div className="space-y-1 pt-1">
        <label className="sr-only" htmlFor="content-middle-bottom-input">콘텐츠 중간하단 입력창</label>
        <input
          id="content-middle-bottom-input"
          type="text"
          placeholder="📌 콘텐츠 중간하단 입력창..."
          autoComplete="off"
          enterKeyHint="send"
          className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
        />
      </div>

      {/* 카드 4: Shadcn Overlay & Dialog Portal Test */}
      <Card className="shadow-2xs rounded-2xl border-border/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">✨ Shadcn Overlay / Portal 테스트</span>
            <Badge variant="blue" className="text-xs">
              fixed inset-0 검증
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-snug">
            position: fixed 세팅에서 다이얼로그 모달 및 포털 알림 토스트가 뷰포트 내에 정상 조율되는지 테스트합니다.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenDialog}
              className="w-full text-xs font-medium rounded-xl justify-center"
            >
              💬 Dialog 모달 열기
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onAddToast('Shadcn Toast 테스트', 'fixed inset-0 환경에서 포털 오버레이 정상 발동!', 'success')
              }
              className="w-full text-xs font-medium rounded-xl justify-center"
            >
              🔔 Toast 알림 띄우기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📌 콘텐츠 최하단 입력창 */}
      <div className="space-y-1 pt-1">
        <label className="sr-only" htmlFor="content-bottom-input">콘텐츠 최하단 입력창</label>
        <input
          id="content-bottom-input"
          type="text"
          placeholder="📌 콘텐츠 최하단 입력창..."
          autoComplete="off"
          enterKeyHint="send"
          className="w-full bg-background border border-input rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
        />
      </div>
    </main>
  );
}
