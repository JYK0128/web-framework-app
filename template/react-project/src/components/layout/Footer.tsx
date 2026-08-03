import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

export type FooterProps = ComponentPropsWithoutRef<'footer'>;

function scrollContentToBottom() {
  requestAnimationFrame(() => {
    const contentEl = document.querySelector<HTMLElement>('.app-content');
    contentEl?.scrollTo({ top: contentEl.scrollHeight, behavior: 'auto' });
  });
}

export function Footer(props: FooterProps) {
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
    <footer {...props}>
      <form className="mx-auto flex w-full max-w-2xl items-end gap-2" onSubmit={(event) => event.preventDefault()}>
        <button className="grid size-11 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600" type="button" aria-label="파일 첨부">
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </button>
        <label className="sr-only" htmlFor="message-input">메시지 입력</label>
        <input 
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="h-11 min-w-0 flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-4 text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" 
          id="message-input" 
          placeholder="메시지를 입력하세요" 
          autoComplete="off" 
        />
        <button className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95" type="submit" aria-label="메시지 보내기">
          <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
        </button>
      </form>
    </footer>
  );
}
