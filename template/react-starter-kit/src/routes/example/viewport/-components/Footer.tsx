import { type RefObject, useEffect, useRef } from 'react';

import { Input } from '#/.generated/shadcn/components/ui';
import { AppFooter } from '#/components/layout';

export interface ViewportMetrics {
  windowHeight: number
  visualHeight: number
  unitPx: number
}

export interface FooterProps {
  inputRef: RefObject<HTMLInputElement | null>
  metrics: ViewportMetrics
  interactiveWidget: string
  heightUnit: string
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
    return () => window.removeEventListener('keyboardopen', handleKeyboardOpen);
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
    <AppFooter className="
      z-10 border-t border-border bg-background
      shadow-[0_-4px_16px_rgba(0,0,0,0.06)]
    "
    >
      <div className="space-y-2 border-b border-border/50 bg-muted/30 p-3">
        <div className="
          grid grid-cols-3 gap-2 rounded-xl border border-border bg-background
          p-2.5 text-center font-mono text-xs shadow-2xs
        "
        >
          <div className="space-y-0.5">
            <div className="font-sans text-xs text-muted-foreground">window (layout)</div>
            <div className="font-bold text-foreground">
              {metrics.windowHeight}
              px
            </div>
          </div>
          <div className="space-y-0.5 border-x border-border px-1">
            <div className="font-sans text-xs text-muted-foreground">visual</div>
            <div className="font-bold text-foreground">
              {metrics.visualHeight}
              px
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-sans text-xs text-muted-foreground">단위 계산</div>
            <div className="font-bold text-foreground">
              {metrics.unitPx}
              px
            </div>
          </div>
        </div>

        <div className="
          flex items-center justify-between px-1 font-mono text-xs
          text-muted-foreground
        "
        >
          <div>
            <span>위젯: </span>
            <strong className="font-semibold text-foreground">{interactiveWidget}</strong>
          </div>
          <div>
            <span>높이: </span>
            <strong className="font-semibold text-foreground">{heightUnit.replace('100', '')}</strong>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-background p-3">
        <Input
          ref={inputRef}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          type="text"
          placeholder="터치하여 가상 키보드 테스트..."
          className="
            flex-1 rounded-xl border border-input bg-muted/60 px-3.5 py-2.5
            text-base font-medium text-foreground shadow-2xs transition-all
            placeholder:text-muted-foreground
            focus:border-primary focus:outline-none focus:ring-2
            focus:ring-primary/20
          "
        />
      </div>
    </AppFooter>
  );
}
