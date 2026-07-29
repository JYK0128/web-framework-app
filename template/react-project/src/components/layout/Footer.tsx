import {
  type ComponentPropsWithoutRef,
  type FormEvent,
  type PointerEvent,
  useRef,
  useState,
} from 'react';

export type FooterProps = ComponentPropsWithoutRef<'footer'>;

export function Footer({ className, children, ...props }: FooterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const focusInput = () => {
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleInputPointerDown = (event: PointerEvent<HTMLInputElement>) => {
    event.preventDefault();
    focusInput();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
  };

  return (
    <footer
      {...props}
      className={className}
    >
      {children ?? <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="viewport-input">메시지 입력</label>
        <input
          className="h-11 w-full min-w-0 rounded-[13px] border border-slate-300 bg-slate-50 px-[13px] text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          ref={inputRef}
          id="viewport-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onPointerDown={handleInputPointerDown}
          placeholder="입력창을 눌러 키보드를 여세요"
          autoComplete="off"
          enterKeyHint="send"
        />
        <button className="min-w-14.5 rounded-xl border-0 bg-indigo-600 px-3.5 text-[13px] font-bold text-white active:scale-[0.97]" type="submit">
          전송
        </button>
      </form>}
    </footer>
  );
}
