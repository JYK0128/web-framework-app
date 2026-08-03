import { useEffect, useRef, type RefObject } from 'react';

export interface ViewportMetrics {
  windowHeight: number;
  visualHeight: number;
  unitPx: number;
}

export interface FooterProps {
  inputRef: RefObject<HTMLInputElement | null>;
  metrics: ViewportMetrics;
  interactiveWidget: string;
  heightUnit: string;
}

function scrollContentToBottom() {
  requestAnimationFrame(() => {
    const contentEl = document.querySelector<HTMLElement>('.app-content');
    contentEl?.scrollTo({ top: contentEl.scrollHeight, behavior: 'auto' });
  });
}

export function Footer({ inputRef, metrics, interactiveWidget, heightUnit }: FooterProps) {
  const waitingForKeyboardRef = useRef(false);

  useEffect(() => {
    const handleKeyboardOpen = () => {
      if (!waitingForKeyboardRef.current) return;

      waitingForKeyboardRef.current = false;
      scrollContentToBottom();
    };

    window.addEventListener('keyboardopen', handleKeyboardOpen);

    return () => {
      window.removeEventListener('keyboardopen', handleKeyboardOpen);
    };
  }, []);

  const handleInputFocus = () => {
    if (document.documentElement.dataset.keyboardState === 'open') {
      scrollContentToBottom();
      return;
    }

    waitingForKeyboardRef.current = true;
  };

  const handleInputBlur = () => {
    waitingForKeyboardRef.current = false;
  };

  return (
    <footer
      className="app-footer border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10"
    >
      {/* 📐 실시간 뷰포트 측정 현황판 */}
      <div className="p-3 border-b border-border/50 space-y-2 bg-muted/30">
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-background p-2.5 rounded-xl border border-border shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground font-sans">window (layout)</div>
            <div className="font-bold text-foreground">{metrics.windowHeight}px</div>
          </div>
          <div className="space-y-0.5 border-x border-border px-1">
            <div className="text-xs text-muted-foreground font-sans">visual</div>
            <div className="font-bold text-foreground">{metrics.visualHeight}px</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground font-sans">단위 계산</div>
            <div className="font-bold text-foreground">{metrics.unitPx}px</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono">
          <div>
            <span>위젯: </span>
            <strong className="text-foreground font-semibold">{interactiveWidget}</strong>
          </div>
          <div>
            <span>높이: </span>
            <strong className="text-foreground font-semibold">{heightUnit.replace('100', '')}</strong>
          </div>
        </div>
      </div>

      {/* 입력창 */}
      <div className="flex items-center gap-2 p-3 bg-background">
        {/* font-size: 16px (text-base) 지정으로 iOS Safari 자동 확대(Focus Zoom) 원천 차단 */}
        <input
          ref={inputRef}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          type="text"
          placeholder="터치하여 가상 키보드 테스트..."
          className="flex-1 bg-muted/60 border border-input rounded-xl px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all font-medium"
        />
      </div>
    </footer>
  );
}
