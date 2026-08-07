import { useCallback, useEffect, useState } from 'react';

interface ElementMetrics {
  rectTop: number
  rectHeight: number
  offsetTop: number
  offsetHeight: number
  clientHeight: number
  scrollTop: number
  scrollHeight: number
  cssTop: number
}

interface ContentMetrics extends ElementMetrics {
  clientTop: number
}

export function HeightGuidelineOverlay() {
  const [vvTop, setVvTop] = useState(0);
  const [vvHeight, setVvHeight] = useState(0);
  const [app, setApp] = useState<ElementMetrics | null>(null);
  const [content, setContent] = useState<ContentMetrics | null>(null);

  const update = useCallback(() => {
    const vv = window.visualViewport;
    const currentVvTop = vv ? Math.round(vv.offsetTop) : 0;
    const currentVvHeight = vv ? Math.round(vv.height) : window.innerHeight;

    setVvTop(currentVvTop);
    setVvHeight(currentVvHeight);

    const appEl = document.querySelector<HTMLElement>('.app');
    if (appEl) {
      const rect = appEl.getBoundingClientRect();
      setApp({
        rectTop: Math.round(rect.top),
        rectHeight: Math.round(rect.height),
        offsetTop: appEl.offsetTop,
        offsetHeight: appEl.offsetHeight,
        clientHeight: appEl.clientHeight,
        scrollTop: appEl.scrollTop,
        scrollHeight: appEl.scrollHeight,
        cssTop: 0,
      });
    }

    const contentEl = document.querySelector<HTMLElement>('.app-content');
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
    const frameId = window.requestAnimationFrame(update);

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
      window.cancelAnimationFrame(frameId);
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

  const vvBottom = vvTop + vvHeight;
  const appTopVal = app ? app.cssTop : 0;
  const appVisibleTop = Math.max(vvTop, appTopVal);
  const appVisibleBottom = app ? Math.min(vvBottom, appTopVal + app.offsetHeight) : vvBottom;
  const contentTop = content ? appTopVal + content.offsetTop : 0;
  const contentBottom = content ? contentTop + content.offsetHeight : 0;
  const contentVisibleTop = Math.max(vvTop, contentTop);
  const contentVisibleBottom = Math.min(vvBottom, contentBottom);

  return (
    <div className="
      pointer-events-none fixed inset-0 z-99999 overflow-hidden font-mono
      text-[10px]
    "
    >
      <div
        className="
          absolute inset-x-0 border-b-2 border-dashed border-blue-500/90
          transition-all duration-75
        "
        style={{ top: `${vvTop}px` }}
      >
        <span className="
          absolute left-2 top-1 rounded-sm border border-blue-500/60 bg-blue-950
          px-1.5 py-0.5 font-bold text-blue-300 shadow-sm
        "
        >
          vv.top:
          {' '}
          {vvTop}
          px
        </span>
      </div>
      <div
        className="
          absolute inset-x-0 border-b-2 border-dashed border-blue-500/90
          transition-all duration-75
        "
        style={{ top: `${vvBottom - 2}px` }}
      >
        <span className="
          absolute -top-6 left-2 rounded-sm border border-blue-500/60
          bg-blue-950 px-1.5 py-0.5 font-bold text-blue-300 shadow-sm
        "
        >
          vv.height:
          {' '}
          {vvHeight}
          px
        </span>
      </div>

      {app && (
        <>
          <div
            className="
              absolute inset-x-0 border-b-2 border-dashed border-green-500/90
              transition-all duration-75
            "
            style={{ top: `${app.cssTop}px` }}
          />
          <div
            className="
              absolute inset-x-0 border-b-2 border-dashed border-green-500/90
              transition-all duration-75
            "
            style={{ top: `${app.cssTop + app.offsetHeight - 2}px` }}
          />
          <div
            className="
              absolute left-1/2 flex -translate-x-1/2 flex-col items-center
              gap-1 transition-all duration-75
            "
            style={{ top: `${appVisibleTop + 4}px` }}
          >
            <span className="
              rounded-sm border border-green-500/60 bg-green-950 px-1.5 py-0.5
              font-bold text-green-300 shadow-sm
            "
            >
              scr.top:
              {app.scrollTop}
              px
            </span>
            <span className="
              rounded-sm border border-green-400/60 bg-green-900/90 px-1.5
              py-0.5 font-bold text-green-200 shadow-sm
            "
            >
              off.top:
              {app.cssTop}
              px
            </span>
          </div>
          <div
            className="
              absolute left-1/2 flex -translate-x-1/2 flex-col-reverse
              items-center gap-1 transition-all duration-75
            "
            style={{ top: `${appVisibleBottom - 2}px` }}
          >
            <div className="
              absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col-reverse
              items-center gap-1
            "
            >
              <span className="
                rounded-sm border border-green-500/60 bg-green-950 px-1.5 py-0.5
                font-bold text-green-300 shadow-sm
              "
              >
                scr.height:
                {app.scrollHeight}
                px
              </span>
              <span className="
                rounded-sm border border-green-400/60 bg-green-900/90 px-1.5
                py-0.5 font-bold text-green-200 shadow-sm
              "
              >
                off.height:
                {app.offsetHeight}
                px
              </span>
            </div>
          </div>
        </>
      )}

      {content && (
        <>
          <div
            className="
              absolute inset-x-0 border-b-2 border-dashed border-purple-500/90
              transition-all duration-75
            "
            style={{ top: `${contentTop}px` }}
          />
          <div
            className="
              absolute inset-x-0 border-b-2 border-dashed border-purple-500/90
              transition-all duration-75
            "
            style={{ top: `${contentBottom - 2}px` }}
          />
          <div
            className="
              absolute right-2 flex flex-col items-end gap-1 transition-all
              duration-75
            "
            style={{ top: `${contentVisibleTop + 4}px` }}
          >
            <span className="
              rounded-sm border border-amber-500/60 bg-amber-950 px-1.5 py-0.5
              font-bold text-amber-300 shadow-sm
            "
            >
              scr.top:
              {content.scrollTop}
              px
            </span>
            <span className="
              rounded-sm border border-purple-500/60 bg-purple-950 px-1.5 py-0.5
              font-bold text-purple-300 shadow-sm
            "
            >
              off.top:
              {content.offsetTop}
              px
            </span>
          </div>
          <div
            className="
              absolute right-2 flex flex-col items-end gap-1 transition-all
              duration-75
            "
            style={{ top: `${contentVisibleBottom - 50}px` }}
          >
            <span className="
              rounded-sm border border-amber-500/60 bg-amber-950 px-1.5 py-0.5
              font-bold text-amber-300 shadow-sm
            "
            >
              scr.height:
              {content.scrollHeight}
              px
            </span>
            <span className="
              rounded-sm border border-purple-500/60 bg-purple-950 px-1.5 py-0.5
              font-bold text-purple-300 shadow-sm
            "
            >
              off.height:
              {content.offsetHeight}
              px
            </span>
          </div>
        </>
      )}
    </div>
  );
}
