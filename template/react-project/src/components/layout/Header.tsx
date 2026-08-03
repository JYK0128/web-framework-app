import type { ComponentPropsWithoutRef } from 'react';

export type HeaderProps = ComponentPropsWithoutRef<'header'>;

export function Header({ children, ...props }: HeaderProps) {
  return <header {...props}>
    <div className="border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-3 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100" type="button" aria-label="뒤로 가기">
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="relative shrink-0">
            <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-200">AM</div>
            <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold tracking-[-0.04em] text-slate-900">Alex Morgan</h1>
            <p className="m-0 mt-0.5 text-[11px] text-emerald-600">온라인 · 마지막 접속 방금 전</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button className="grid size-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100" type="button" aria-label="통화">
            <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" /></svg>
          </button>
          <button className="grid size-9 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100" type="button" aria-label="더 보기">
            <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>
          </button>
        </div>
      </div>
    </div>
  </header>;
}
