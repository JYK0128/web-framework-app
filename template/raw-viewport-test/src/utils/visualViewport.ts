/**
 * 📱 모바일 Visual Viewport 전역 동기화 유틸리티 (Standalone Listener)
 * 
 * main.tsx 등 앱 진입점(Entrypoint)에서 단 한 번 실행하면
 * 브라우저 이벤트(resize, scroll, orientationchange)를 감지하여
 * --visual-viewport-height 및 --visual-viewport-top CSS 변수를 실시간 자동 주입합니다.
 */
export function initVisualViewport(): () => void {
  if (typeof window === 'undefined') return () => {};

  const root = document.documentElement;
  const viewport = window.visualViewport;
  let frameId = 0;

  const update = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      // iOS Safari 포커스 시 window.scrollY가 들뜨는 현상 강제 복구 (Window Scroll Lock)
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }

      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;

      root.style.setProperty('--visual-viewport-height', `${Math.round(height)}px`);
      root.style.setProperty('--visual-viewport-top', `${Math.round(top)}px`);
    });
  };

  const handleWindowScroll = () => {
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  };

  update();

  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  window.addEventListener('scroll', handleWindowScroll);
  window.addEventListener('orientationchange', update);

  return () => {
    cancelAnimationFrame(frameId);
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
    window.removeEventListener('scroll', handleWindowScroll);
    window.removeEventListener('orientationchange', update);

    root.style.removeProperty('--visual-viewport-height');
    root.style.removeProperty('--visual-viewport-top');
  };
}
