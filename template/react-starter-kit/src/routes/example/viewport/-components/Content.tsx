import { Badge, Button, Card, CardContent, Input, Label, ToggleGroup, ToggleGroupItem } from '#/.generated/shadcn/components/ui';
import { AppContent } from '#/components/layout';

export type ViewportFitMode = 'cover' | 'contain' | 'auto';
export type InteractiveWidgetMode = 'resizes-content' | 'resizes-visual' | 'overlays-content' | 'none';
export type HeightUnitMode = '100%' | '100dvh' | '100vh' | '100svh' | '100lvh';

export interface ContentProps {
  viewportFit: ViewportFitMode
  onChangeViewportFit: (mode: ViewportFitMode) => void
  heightUnit: HeightUnitMode
  onChangeHeightUnit: (unit: HeightUnitMode) => void
  interactiveWidget: InteractiveWidgetMode
  onChangeInteractiveWidget: (mode: InteractiveWidgetMode) => void
  onFocusInput: () => void
  onOpenDialog: () => void
  onAddToast: (title: string, description?: string, type?: 'default' | 'success' | 'warning') => void
}

export function Content({
  viewportFit,
  onChangeViewportFit,
  heightUnit,
  onChangeHeightUnit,
  interactiveWidget,
  onChangeInteractiveWidget,
  onFocusInput,
  onOpenDialog,
  onAddToast,
}: ContentProps) {
  return (
    <AppContent className="scroll-y min-w-0 min-h-0 space-y-3.5 bg-muted/20 p-4">
      <div className="space-y-1">
        <Label className="sr-only" htmlFor="content-top-input">콘텐츠 최상단 입력창</Label>
        <Input
          id="content-top-input"
          type="text"
          placeholder="📌 콘텐츠 최상단 입력창..."
          autoComplete="off"
          enterKeyHint="next"
          className="
            w-full rounded-xl border border-input bg-background px-3.5 py-2.5
            text-base text-foreground shadow-2xs transition-all
            placeholder:text-muted-foreground
            focus:border-primary focus:outline-none focus:ring-2
            focus:ring-primary/20
          "
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-2xs">
        <CardContent className="space-y-3.5 p-4">
          <div className="
            flex items-center justify-between rounded-xl border border-border/30
            bg-muted/50 p-2.5 text-xs
          "
          >
            <span className="font-medium text-muted-foreground">🔄 화면 회전 단축키</span>
            <kbd className="
              rounded-md border border-border/60 bg-background px-2 py-0.5
              font-mono text-xs font-semibold text-foreground shadow-2xs
            "
            >
              ⌘ + ⬅️ / ➡️
            </kbd>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-foreground">viewport-fit</div>
            <ViewportOptionGroup
              options={(['cover', 'contain', 'auto'] as ViewportFitMode[]).map((mode) => ({ id: mode, label: mode }))}
              value={viewportFit}
              onChange={onChangeViewportFit}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-2xs">
        <CardContent className="space-y-2 p-4">
          <div className="text-xs font-semibold text-foreground">Height Unit</div>
          <ViewportOptionGroup
            options={(['100%', '100dvh', '100vh', '100svh', '100lvh'] as HeightUnitMode[]).map((unit) => ({ id: unit, label: unit }))}
            value={heightUnit}
            onChange={onChangeHeightUnit}
          />
        </CardContent>
      </Card>

      <div className="space-y-1">
        <Label className="sr-only" htmlFor="content-middle-input">콘텐츠 중간 입력창</Label>
        <Input
          id="content-middle-input"
          type="text"
          placeholder="📌 콘텐츠 중간 입력창..."
          autoComplete="off"
          enterKeyHint="next"
          className="
            w-full rounded-xl border border-input bg-background px-3.5 py-2.5
            text-base text-foreground shadow-2xs transition-all
            placeholder:text-muted-foreground
            focus:border-primary focus:outline-none focus:ring-2
            focus:ring-primary/20
          "
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-2xs">
        <CardContent className="space-y-3.5 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">⌨️ 가상 키보드 토글</span>
            <span className="font-mono text-xs text-muted-foreground">iOS: ⌘+K</span>
          </div>

          <Button
            id="btn-focus-input"
            size="lg"
            onClick={onFocusInput}
            className="w-full justify-center rounded-xl font-medium"
          >
            ⌨️ 버튼 클릭으로 입력창 포커스하기
          </Button>

          <div className="space-y-1.5 border-t border-border/30 pt-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">interactive-widget</span>
              <Badge
                variant="outline"
                className="
                  border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs
                  text-emerald-700
                "
              >
                AOS 전용
              </Badge>
            </div>
            <ViewportOptionGroup
              options={[
                { id: 'resizes-content', label: 'resizes-\ncontent' },
                { id: 'resizes-visual', label: 'resizes-\nvisual' },
                { id: 'overlays-content', label: 'overlays-\ncontent' },
                { id: 'none', label: 'none' },
              ]}
              value={interactiveWidget}
              onChange={onChangeInteractiveWidget}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1 pt-1">
        <Label className="sr-only" htmlFor="content-middle-bottom-input">콘텐츠 중간하단 입력창</Label>
        <Input
          id="content-middle-bottom-input"
          type="text"
          placeholder="📌 콘텐츠 중간하단 입력창..."
          autoComplete="off"
          enterKeyHint="send"
          className="
            w-full rounded-xl border border-input bg-background px-3.5 py-2.5
            text-base text-foreground shadow-2xs transition-all
            placeholder:text-muted-foreground
            focus:border-primary focus:outline-none focus:ring-2
            focus:ring-primary/20
          "
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-2xs">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">✨ Shadcn Overlay / Portal 테스트</span>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-xs text-blue-600"
            >
              fixed inset-0 검증
            </Badge>
          </div>
          <p className="text-xs/snug text-muted-foreground">
            position: fixed 세팅에서 다이얼로그 모달 및 포털 알림 토스트가 뷰포트 내에 정상 조율되는지 테스트합니다.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenDialog}
              className="w-full justify-center rounded-xl text-xs font-medium"
            >
              💬 Dialog 모달 열기
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAddToast('Shadcn Toast 테스트', 'fixed inset-0 환경에서 포털 오버레이 정상 발동!', 'success')}
              className="w-full justify-center rounded-xl text-xs font-medium"
            >
              🔔 Toast 알림 띄우기
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1 pt-1">
        <Label className="sr-only" htmlFor="content-bottom-input">콘텐츠 최하단 입력창</Label>
        <Input
          id="content-bottom-input"
          type="text"
          placeholder="📌 콘텐츠 최하단 입력창..."
          autoComplete="off"
          enterKeyHint="send"
          className="
            w-full rounded-xl border border-input bg-background px-3.5 py-2.5
            text-base text-foreground shadow-2xs transition-all
            placeholder:text-muted-foreground
            focus:border-primary focus:outline-none focus:ring-2
            focus:ring-primary/20
          "
        />
      </div>
    </AppContent>
  );
}

interface ViewportOptionGroupProps<T extends string> {
  options: Array<{ id: T, label: string }>
  value: T
  onChange: (value: T) => void
}

function ViewportOptionGroup<T extends string>({ options, value, onChange }: ViewportOptionGroupProps<T>) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(nextValue) => {
        const next = nextValue[0];
        if (next) onChange(next as T);
      }}
      variant="outline"
      size="sm"
      spacing={0}
      className="
        grid w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] overflow-hidden
        rounded-xl border border-border/40 bg-muted/80 shadow-inner
      "
    >
      {options.map(({ id, label }) => (
        <ToggleGroupItem
          key={id}
          value={id}
          className="
            min-h-8 rounded-none border-0 px-1 text-center text-xs/tight
            whitespace-pre-line
            first:rounded-l-lg
            last:rounded-r-lg
          "
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
