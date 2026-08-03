import type { ComponentPropsWithoutRef } from 'react';

export type ContentProps = ComponentPropsWithoutRef<'main'>;

export function Content({ children, ...props }: ContentProps) {
  return <main {...props}>
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="w-full max-w-xl">
        <label className="sr-only" htmlFor="conversation-input-top">최상단 입력창</label>
        <input className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" id="conversation-input-top" placeholder="최상단 입력 포커스 테스트" autoComplete="off" />
      </div>

      <div className="flex items-center gap-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>Today, May 28</span><span className="h-px flex-1 bg-slate-200" /></div>

      <div className="mx-auto max-w-[290px] rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-[11px] leading-[1.55] text-indigo-700 shadow-sm"><span className="mr-1">🔒</span> 메시지는 종단간 암호화되어 안전하게 보호됩니다.</div>

      <div className="flex items-end gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">AM</div>
        <div className="max-w-[78%]">
          <p className="m-0 mb-1 px-1 text-[10px] font-semibold text-slate-500">Alex Morgan</p>
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] leading-[1.55] text-slate-700 shadow-[0_3px_14px_rgba(15,23,42,0.06)]">Hey! Did you get a chance to look at the new project brief?</div>
          <p className="m-0 mt-1 px-1 text-[10px] text-slate-400">10:41 AM</p>
        </div>
      </div>

      <div className="ml-10 max-w-xl">
        <label className="sr-only" htmlFor="conversation-input-middle-top">중간상단 입력창</label>
        <input className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" id="conversation-input-middle-top" placeholder="중간상단 입력 포커스 테스트" autoComplete="off" />
      </div>

      <div className="flex justify-end">
        <div className="max-w-[78%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[13px] leading-[1.55] text-white shadow-[0_5px_16px_rgba(79,70,229,0.18)]">Yes, I just finished reading it. The direction looks really solid — especially the part about keeping the first release focused.</div>
          <div className="mt-1 flex items-center justify-end gap-1 px-1 text-[10px] text-slate-400"><span>10:44 AM</span><svg aria-label="읽음" className="size-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m4 12 4 4L20 4" /><path d="m10 16 2 2 8-10" /></svg></div>
        </div>
      </div>

      <div className="flex items-end gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">AM</div>
        <div className="max-w-[78%]">
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] leading-[1.55] text-slate-700 shadow-[0_3px_14px_rgba(15,23,42,0.06)]">I agree. Let’s sync tomorrow and turn it into a short list of next steps.</div>
          <p className="m-0 mt-1 px-1 text-[10px] text-slate-400">10:46 AM</p>
        </div>
      </div>

      <div className="flex items-center gap-3 py-1"><span className="h-px flex-1 bg-indigo-200" /><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold text-indigo-600">2 unread messages</span><span className="h-px flex-1 bg-indigo-200" /></div>

      <div className="mx-auto w-full max-w-xl">
        <label className="sr-only" htmlFor="conversation-input-middle">중간 입력창</label>
        <input className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" id="conversation-input-middle" placeholder="중간 입력 포커스 테스트" autoComplete="off" />
      </div>

      <div className="flex justify-end">
        <div className="max-w-[78%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[13px] leading-[1.55] text-white shadow-[0_5px_16px_rgba(79,70,229,0.18)]">Perfect. I’ll bring a first pass to the call. Have a good evening!</div>
          <div className="mt-1 flex items-center justify-end gap-1 px-1 text-[10px] text-slate-400"><span>10:49 AM</span><svg aria-label="읽음" className="size-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m4 12 4 4L20 4" /><path d="m10 16 2 2 8-10" /></svg></div>
        </div>
      </div>

      <div className="ml-auto w-full max-w-xl">
        <label className="sr-only" htmlFor="conversation-input-middle-bottom">중간하단 입력창</label>
        <input className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" id="conversation-input-middle-bottom" placeholder="중간하단 입력 포커스 테스트" autoComplete="off" />
      </div>

      <div className="flex items-end gap-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white">AM</div>
        <div className="max-w-[78%]">
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[13px] leading-[1.55] text-slate-700 shadow-[0_3px_14px_rgba(15,23,42,0.06)]">You too! Talk soon 👋</div>
          <p className="m-0 mt-1 px-1 text-[10px] text-slate-400">10:50 AM</p>
        </div>
      </div>

      <div className="ml-10 max-w-xl">
        <label className="sr-only" htmlFor="conversation-input-bottom">최하단 입력창</label>
        <input className="h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" id="conversation-input-bottom" placeholder="최하단 입력 포커스 테스트" autoComplete="off" />
      </div>
    </div>
  </main>;
}
