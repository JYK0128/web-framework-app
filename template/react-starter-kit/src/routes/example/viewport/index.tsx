import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2, Code2, Info, Keyboard, RefreshCw, Send, Smartphone, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Switch } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/example/viewport/')({
  component: ViewportTestPage,
});

type ViewportFitMode = 'cover' | 'contain' | 'auto';
type InteractiveWidgetMode = 'resizes-visual' | 'resizes-content' | 'overlays-content' | 'none';

function ViewportTestPage() {
  const [useSafeArea, setUseSafeArea] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<string[]>([
    '입력창을 터치해 가상 키보드를 열고, interactive-widget 옵션별 레이아웃 변화를 관찰해보세요.',
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // 1. Dynamic Meta Viewport Settings State
  const [viewportFit, setViewportFit] = useState<ViewportFitMode>('cover');
  const [interactiveWidget, setInteractiveWidget] = useState<InteractiveWidgetMode>('resizes-content');

  // 2. Real-time Viewport & Keyboard Metrics State
  const [metrics, setMetrics] = useState({
    windowWidth: 0,
    windowHeight: 0,
    visualWidth: 0,
    visualHeight: 0,
    visualOffsetTop: 0,
    keyboardHeight: 0,
    isKeyboardOpen: false,
    safeAreaTop: '0px',
    safeAreaBottom: '0px',
    userAgent: '',
  });

  const updateMetrics = () => {
    if (typeof window === 'undefined') return;

    // Computed style from a dummy hidden element to measure env()
    const testEl = document.createElement('div');
    testEl.style.position = 'fixed';
    testEl.style.top = 'env(safe-area-inset-top, 0px)';
    testEl.style.bottom = 'env(safe-area-inset-bottom, 0px)';
    testEl.style.left = 'env(safe-area-inset-left, 0px)';
    testEl.style.right = 'env(safe-area-inset-right, 0px)';
    testEl.style.visibility = 'hidden';
    document.body.appendChild(testEl);

    const computed = window.getComputedStyle(testEl);
    const top = computed.top;
    const bottom = computed.bottom;

    document.body.removeChild(testEl);

    const vv = window.visualViewport;
    const winH = window.innerHeight;
    const vvH = vv ? Math.round(vv.height) : winH;
    const kbDelta = Math.max(0, winH - vvH);

    setMetrics({
      windowWidth: window.innerWidth,
      windowHeight: winH,
      visualWidth: vv ? Math.round(vv.width) : window.innerWidth,
      visualHeight: vvH,
      visualOffsetTop: vv ? Math.round(vv.offsetTop) : 0,
      keyboardHeight: kbDelta,
      isKeyboardOpen: kbDelta > 150,
      safeAreaTop: top !== 'auto' ? top : '0px',
      safeAreaBottom: bottom !== 'auto' ? bottom : '0px',
      userAgent: navigator.userAgent,
    });
  };

  // Dynamically update document <meta name="viewport"> tag
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    const widgetStr = interactiveWidget !== 'none' ? `, interactive-widget=${interactiveWidget}` : '';
    const contentString = `width=device-width, initial-scale=1.0, viewport-fit=${viewportFit}${widgetStr}`;
    meta.content = contentString;

    const rafId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(rafId);
      // Restore default meta viewport on unmount
      if (meta) {
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      }
    };
  }, [viewportFit, interactiveWidget]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateMetrics);

    window.addEventListener('resize', updateMetrics);
    window.addEventListener('orientationchange', updateMetrics);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateMetrics);
      vv.addEventListener('scroll', updateMetrics);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
      if (vv) {
        vv.removeEventListener('resize', updateMetrics);
        vv.removeEventListener('scroll', updateMetrics);
      }
    };
  }, []);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, chatInput.trim()]);
    setChatInput('');
  };

  const osLabel = getOsLabel(metrics.userAgent);
  const widgetAttr = interactiveWidget !== 'none' ? `, interactive-widget=${interactiveWidget}` : '';
  const currentMetaString = `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=${viewportFit}${widgetAttr}" />`;

  return (
    <div className="
      relative flex min-h-dvh flex-col bg-slate-950 text-slate-100 antialiased
    "
    >
      {/* 🔴 상단 고정 헤더 */}
      <header
        className={`
          sticky top-0 z-50 flex items-center justify-between border-b
          border-slate-800 bg-slate-900/90 backdrop-blur-md transition-all
          duration-300
          ${useSafeArea ? 'pt-[env(safe-area-inset-top,0px)] px-4 pb-3' : 'p-4'}
        `}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8 text-slate-400" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="
              text-sm font-bold text-slate-100
              sm:text-base
            "
            >
              Viewport & Interactive Widget
            </h1>
            <p className="text-[10px] text-slate-400">
              viewport-fit × interactive-widget 동적 실험실
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="
              border-purple-500/40 bg-purple-500/10 text-purple-300 text-[10px]
            "
          >
            Fit:
            {' '}
            {viewportFit}
          </Badge>
          <Badge
            variant="outline"
            className="
              border-emerald-500/40 bg-emerald-500/10 text-emerald-300
              text-[10px]
            "
          >
            Widget:
            {' '}
            {interactiveWidget}
          </Badge>
        </div>
      </header>

      {/* 🟢 Main Content Area */}
      <main
        className={`
          flex-1 space-y-4 p-4 transition-all duration-300 pb-36
          ${useSafeArea
      ? `pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]`
      : ''}
        `}
      >
        {/* 🎛️ 1. 조건 설정 컨트롤러 카드 */}
        <Card className="
          border-indigo-500/30 bg-indigo-950/20 shadow-xl backdrop-blur-sm
        "
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-indigo-400" />
              <CardTitle className="text-base text-slate-100">
                실험 조건 제어판 (Meta Viewport)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-300">
              다양한 조합을 선택하고 아래 입력창을 클릭하여 가상 키보드 동작을 비교하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Condition 1: viewport-fit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold text-[11px]">
                  1) viewport-fit (노치/홈바 화면 확장)
                </label>
                <span className="text-[10px] text-indigo-300 font-mono">
                  현재:
                  {viewportFit}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['cover', 'contain', 'auto'] as ViewportFitMode[]).map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={viewportFit === mode ? 'default' : 'outline'}
                    onClick={() => setViewportFit(mode)}
                    className={`
                      text-xs h-8
                      ${viewportFit === mode
                    ? `
                      bg-indigo-600
                      hover:bg-indigo-500
                      text-white font-bold
                    `
                    : `border-slate-700 text-slate-300`}
                    `}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Condition 2: interactive-widget */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold text-[11px]">
                  2) interactive-widget (가상 키보드 뷰포트 변경 방식)
                </label>
                <span className="text-[10px] text-emerald-300 font-mono">
                  현재:
                  {interactiveWidget}
                </span>
              </div>
              <div className="
                grid grid-cols-2 gap-1.5
                sm:grid-cols-4
              "
              >
                {(
                  [
                    { id: 'resizes-content', label: 'resizes-content (권장)' },
                    { id: 'resizes-visual', label: 'resizes-visual' },
                    { id: 'overlays-content', label: 'overlays-content' },
                    { id: 'none', label: '미지정 (기본)' },
                  ] as { id: InteractiveWidgetMode, label: string }[]
                ).map(({ id, label }) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={interactiveWidget === id ? 'default' : 'outline'}
                    onClick={() => setInteractiveWidget(id)}
                    className={`
                      text-[11px] h-9 py-1 px-2 leading-tight
                      ${interactiveWidget === id
                    ? `
                      bg-emerald-600
                      hover:bg-emerald-500
                      text-white font-bold
                    `
                    : `border-slate-700 text-slate-300`}
                    `}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Condition 3: Safe Area Padding Toggle */}
            <div className="
              flex items-center justify-between rounded-lg bg-slate-950 p-2.5
              border border-slate-800
            "
            >
              <div>
                <p className="font-medium text-slate-200">3) Safe Area Padding 적용 (pt/pb-safe)</p>
                <p className="text-[10px] text-slate-400">
                  env(safe-area-inset-top/bottom) 패딩 적용 여부
                </p>
              </div>
              <Switch checked={useSafeArea} onCheckedChange={setUseSafeArea} />
            </div>

            {/* Current Meta Code Banner */}
            <div className="
              rounded-lg bg-slate-950 p-2.5 border border-slate-800 space-y-1
            "
            >
              <p className="text-[10px] text-slate-400">실시간 Document Viewport 태그:</p>
              <pre className="
                font-mono text-[11px] text-emerald-400 whitespace-pre-wrap
                break-all
              "
              >
                {currentMetaString}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 📚 2. interactive-widget 각 옵션별 작동 설명 카드 */}
        <Card className="
          border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm
        "
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-400" />
              <CardTitle className="text-base text-slate-100">
                interactive-widget 옵션별 핵심 차이
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="
              rounded-lg bg-slate-950 p-2.5 border border-emerald-800/40
              space-y-1
            "
            >
              <p className="font-bold text-emerald-400">🔹 resizes-content (웹앱 추천)</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                키보드가 켜지면 **전체 Layout Viewport(100dvh)의 높이가 키보드만큼 줄어듭니다.** 하단 고정 요소(버튼, 입력창)가 키보드 바로 위로 자연스럽게 밀려 올라갑니다.
              </p>
            </div>

            <div className="
              rounded-lg bg-slate-950 p-2.5 border border-slate-800 space-y-1
            "
            >
              <p className="font-bold text-indigo-400">🔹 resizes-visual</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Visual Viewport만 줄어들고 Layout Viewport 높이는 그대로 유지됩니다. 스크롤 위치에 따라 화면이 밀릴 수 있습니다.
              </p>
            </div>

            <div className="
              rounded-lg bg-slate-950 p-2.5 border border-slate-800 space-y-1
            "
            >
              <p className="font-bold text-rose-400">🔹 overlays-content</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                키보드가 화면 레이아웃에 **아무런 영향을 주지 않고 덮어씌웁니다(Overlay)**. 입력창이나 버튼이 키보드 뒤로 숨겨질 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 📊 3. Real-time Viewport & Keyboard Metrics */}
        <Card className="
          border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm
        "
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-5 text-emerald-400" />
                <CardTitle className="text-base text-slate-100">실시간 뷰포트 & 키보드 측정값</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-slate-400"
                onClick={updateMetrics}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="rounded-lg bg-slate-950 p-2.5">
              <p className="text-[10px] text-slate-400">Layout Height (window.innerHeight)</p>
              <p className="mt-1 font-bold text-slate-200">
                {metrics.windowHeight}
                px
              </p>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5">
              <p className="text-[10px] text-slate-400">Visual Height (visualViewport)</p>
              <p className="mt-1 font-bold text-emerald-400">
                {metrics.visualHeight}
                px
              </p>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5">
              <p className="text-[10px] text-slate-400">Visual Offset Top</p>
              <p className="mt-1 font-bold text-indigo-400">
                {metrics.visualOffsetTop}
                px
              </p>
            </div>
            <div className="rounded-lg bg-slate-950 p-2.5">
              <p className="text-[10px] text-slate-400">감지된 키보드 높이 (Delta)</p>
              <p className="mt-1 font-bold text-purple-400">
                {metrics.keyboardHeight}
                px
              </p>
            </div>
            <div className="
              rounded-lg bg-slate-950 p-2.5 col-span-2 flex items-center
              justify-between
            "
            >
              <div>
                <p className="text-[10px] text-slate-400">감지된 OS 환경</p>
                <p className="mt-0.5 font-sans font-semibold text-slate-200">
                  {osLabel}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] border-slate-700 text-slate-300"
              >
                {metrics.isKeyboardOpen ? 'Keyboard OPEN' : 'Keyboard CLOSED'}
              </Badge>
            </div>
            <div className="
              rounded-lg bg-slate-950 p-2.5 col-span-2 flex items-center
              justify-between
            "
            >
              <div>
                <p className="text-[10px] text-slate-400">가상 키보드 감지 상태</p>
                <p className={`
                  mt-0.5 font-sans font-bold
                  ${metrics.isKeyboardOpen
      ? `text-amber-400`
      : `text-slate-400`}
                `}
                >
                  {metrics.isKeyboardOpen ? '⌨️ 가상 키보드 열림 (Keyboard OPEN)' : '🔒 가상 키보드 닫힘 (CLOSED)'}
                </p>
              </div>
              <Keyboard className={`
                size-5
                ${metrics.isKeyboardOpen
      ? `text-amber-400 animate-bounce`
      : `text-slate-600`}
              `}
              />
            </div>
          </CardContent>
        </Card>

        {/* ℹ️ Safe Area Insets */}
        <Card className="
          border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm
        "
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-sky-400" />
              <CardTitle className="text-sm font-semibold text-slate-200">Safe Area Insets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex justify-between rounded-sm bg-slate-950 p-2">
              <span className="text-slate-400">Top:</span>
              <span className="font-bold text-purple-400">{metrics.safeAreaTop}</span>
            </div>
            <div className="flex justify-between rounded-sm bg-slate-950 p-2">
              <span className="text-slate-400">Bottom:</span>
              <span className="font-bold text-purple-400">{metrics.safeAreaBottom}</span>
            </div>
          </CardContent>
        </Card>

        {/* 채팅 메시지 목록 */}
        <Card className="
          border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm
        "
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200">채팅 테스트 메시지</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className="
                  rounded-lg bg-slate-950 p-2.5 border border-slate-800
                  text-slate-200
                "
              >
                💬
                {' '}
                {msg}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      {/* 💬 🔴 가상 키보드 테스트용 하단 고정 채팅 인풋바 */}
      <div
        className={`
          fixed bottom-0 inset-x-0 z-50 border-t border-slate-800
          bg-slate-900/95 backdrop-blur-lg transition-all duration-300
          ${useSafeArea
      ? 'pb-[env(safe-area-inset-bottom,0px)] px-3 pt-2.5'
      : `p-2.5`}
        `}
      >
        <div className="mb-1.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[10px]">
            <CheckCircle2 className="size-3 text-emerald-400" />
            <span className="text-slate-300 font-mono">
              fit=
              {viewportFit}
              {' '}
              | widget=
              {interactiveWidget}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`
              text-[10px] py-0 px-1.5
              ${useSafeArea
      ? 'border-emerald-500/40 text-emerald-300'
      : `border-rose-500/40 text-rose-300`}
            `}
          >
            Safe Bottom:
            {' '}
            {metrics.safeAreaBottom}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onFocus={updateMetrics}
            onBlur={updateMetrics}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="터치하여 가상 키보드를 호출하세요..."
            className="
              h-10 border-slate-700 bg-slate-950 text-slate-100 text-sm
              placeholder:text-slate-500
              focus-visible:ring-indigo-500
            "
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!chatInput.trim()}
            className="
              size-10 shrink-0 bg-indigo-600
              hover:bg-indigo-500
              text-white
            "
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getOsLabel(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return '🍎 iOS (WKWebView)';
  }
  if (/Android/i.test(userAgent)) {
    return '🤖 Android (WebView)';
  }
  return '💻 Desktop Browser';
}
