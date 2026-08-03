import { useEffect, useState, useCallback } from 'react';

interface ElementMetrics {
  rectTop: number;
  rectHeight: number;
  offsetTop: number;
  offsetHeight: number;
  clientHeight: number;
  scrollTop: number;
  scrollHeight: number;
  cssTop: number;
}

interface ContentMetrics extends ElementMetrics {
  clientTop: number;
}

export function HeightGuidelineOverlay() {
  const [vvTop, setVvTop] = useState<number>(0);
  const [vvHeight, setVvHeight] = useState<number>(0);
  const [app, setApp] = useState<ElementMetrics | null>(null);
  const [content, setContent] = useState<ContentMetrics | null>(null);

  const update = useCallback(() => {
    // 1. Visual Viewport
    const vv = window.visualViewport;
    let currentVvTop = 0;
    let currentVvHeight = window.innerHeight;

    if (vv) {
      currentVvTop = Math.round(vv.offsetTop);
      currentVvHeight = Math.round(vv.height);
    }
    setVvTop(currentVvTop);
    setVvHeight(currentVvHeight);

    // 2. .app container metrics
    const appEl = document.querySelector('.app') as HTMLElement | null;
    if (appEl) {
      const rect = appEl.getBoundingClientRect();
      const varTop = 0;

      setApp({
        rectTop: Math.round(rect.top),
        rectHeight: Math.round(rect.height),
        offsetTop: appEl.offsetTop,
        offsetHeight: appEl.offsetHeight,
        clientHeight: appEl.clientHeight,
        scrollTop: appEl.scrollTop,
        scrollHeight: appEl.scrollHeight,
        cssTop: Math.round(varTop),
      });
    }

    // 3. .app-content metrics
    const contentEl = document.querySelector('.app-content') as HTMLElement | null;
    if (contentEl) {
      const rect = contentEl.getBoundingClientRect();
      setContent({
        rectTop: Math.round(rect.top),
        rectHeight: Math.round(rect.height),
        clientTop: contentEl.clientTop,
        clientHeight: contentEl.clientHeight,
        offsetTop: contentEl.offsetTop,
        offsetHeight: contentEl.offsetHeight,
        scrollTop: contentEl.scrollTop,
        scrollHeight: contentEl.scrollHeight,
        cssTop: contentEl.offsetTop,
      });
    }
  }, []);

  useEffect(() => {
    update();

    const vv = window.visualViewport;
    vv?.addEventListener('resize', update, { passive: true });
    vv?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('focusout', update, { passive: true });
    window.addEventListener('focusin', update, { passive: true });

    const appEl = document.querySelector('.app');
    appEl?.addEventListener('scroll', update, { passive: true });

    const contentEl = document.querySelector('.app-content');
    contentEl?.addEventListener('scroll', update, { passive: true });

    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('focusout', update);
      window.removeEventListener('focusin', update);
      appEl?.removeEventListener('scroll', update);
      contentEl?.removeEventListener('scroll', update);
    };
  }, [update]);

  // Visual Viewport Bounds
  const vvBottom = vvTop + vvHeight;

  // App visible bounds within Visual Viewport
  const appTopVal = app ? app.cssTop : 0;
  const appVisibleTop = Math.max(vvTop, appTopVal);
  const appVisibleBottom = app ? Math.min(vvBottom, appTopVal + app.offsetHeight) : vvBottom;

  // Content actual bounds relative to document
  const contentTop = content ? appTopVal + content.offsetTop : 0;
  const contentBottom = content ? contentTop + content.offsetHeight : 0;

  // Content visible bounds within Visual Viewport
  const contentVisibleTop = Math.max(vvTop, contentTop);
  const contentVisibleBottom = Math.min(vvBottom, contentBottom);

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden font-mono text-[10px]">
      {/* ================= 1. VISUAL VIEWPORT (BLUE / 파란색) ================= */}
      {/* VV Top Line */}
      <div
        className="absolute left-0 right-0 border-b-2 border-dashed border-blue-500/90 transition-all duration-75"
        style={{ top: `${vvTop}px` }}
      >
        <span className="absolute left-2 top-1 rounded bg-blue-950 px-1.5 py-0.5 text-blue-300 border border-blue-500/60 shadow font-bold">
          vv.top: {vvTop}px
        </span>
      </div>

      {/* VV Height Line */}
      <div
        className="absolute left-0 right-0 border-b-2 border-dashed border-blue-500/90 transition-all duration-75"
        style={{ top: `${vvBottom - 2}px` }}
      >
        <span className="absolute left-2 -top-6 rounded bg-blue-950 px-1.5 py-0.5 text-blue-300 border border-blue-500/60 shadow font-bold">
          vv.height: {vvHeight}px
        </span>
      </div>

      {/* ================= 2. .APP CONTAINER (GREEN / 초록색) ================= */}
      {app && (
        <>
          {/* App Top Line */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-green-500/90 transition-all duration-75"
            style={{ top: `${app.cssTop}px` }}
          />

          {/* App Bottom Line */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-green-500/90 transition-all duration-75"
            style={{ top: `${app.cssTop + app.offsetHeight - 2}px` }}
          />

          {/* App Top Center Stack */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-75 flex flex-col items-center gap-1"
            style={{ top: `${appVisibleTop + 4}px` }}
          >
            <span className="rounded bg-green-950 px-1.5 py-0.5 text-green-300 border border-green-500/60 shadow font-bold">
              scr.top: {app.scrollTop}px
            </span>
            <span className="rounded bg-green-900/90 px-1.5 py-0.5 text-green-200 border border-green-400/60 shadow font-bold">
              off.top: {app.cssTop}px
            </span>
          </div>

          {/* App Bottom Center Stack */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-75 flex flex-col-reverse items-center gap-1"
            style={{ top: `${appVisibleBottom - 2}px` }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex flex-col-reverse items-center gap-1">
              <span className="rounded bg-green-950 px-1.5 py-0.5 text-green-300 border border-green-500/60 shadow font-bold">
                scr.height: {app.scrollHeight}px
              </span>
              <span className="rounded bg-green-900/90 px-1.5 py-0.5 text-green-200 border border-green-400/60 shadow font-bold">
                off.height: {app.offsetHeight}px
              </span>
            </div>
          </div>
        </>
      )}

      {/* ================= 3. .APP-CONTENT (PURPLE & AMBER) ================= */}
      {content && (
        <>
          {/* Content Top Line (Header 아래 offsetTop 위치) */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-purple-500/90 transition-all duration-75"
            style={{ top: `${contentTop}px` }}
          />

          {/* Content Bottom Line (.app-content 하단 경계선 위치) */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-purple-500/90 transition-all duration-75"
            style={{ top: `${contentBottom - 2}px` }}
          />

          {/* Top Right Stack */}
          <div
            className="absolute right-2 transition-all duration-75 flex flex-col items-end gap-1"
            style={{ top: `${contentVisibleTop + 4}px` }}
          >
            <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-300 border border-amber-500/60 shadow font-bold">
              scr.top: {content.scrollTop}px
            </span>
            <span className="rounded bg-purple-950 px-1.5 py-0.5 text-purple-300 border border-purple-500/60 shadow font-bold">
              off.top: {content.offsetTop}px
            </span>
          </div>

          {/* Bottom Right Stack */}
          <div
            className="absolute right-2 transition-all duration-75 flex flex-col items-end gap-1"
            style={{ top: `${contentVisibleBottom - 50}px` }}
          >
            <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-300 border border-amber-500/60 shadow font-bold">
              scr.height: {content.scrollHeight}px
            </span>
            <span className="rounded bg-purple-950 px-1.5 py-0.5 text-purple-300 border border-purple-500/60 shadow font-bold">
              off.height: {content.offsetHeight}px
            </span>
          </div>
        </>
      )}
    </div>
  );
}
