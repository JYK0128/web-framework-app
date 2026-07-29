import type { ComponentPropsWithRef } from 'react';

const demoRows = Array.from({ length: 36 }, (_, index) => index + 1);

export type ContentProps = Omit<ComponentPropsWithRef<'main'>, 'children'>;

export function Content({ className, ref, ...props }: ContentProps) {
  return (
    <main {...props} ref={ref} className={className}>
      <div className="px-3 pt-3">
        <label className="sr-only" htmlFor="viewport-top-input">콘텐츠 최상단 입력창</label>
        <input
          className="h-11 w-full rounded-[13px] border border-slate-300 px-3.25 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="viewport-top-input"
          placeholder="콘텐츠 최상단 입력창"
          autoComplete="off"
          enterKeyHint="next"
        />
      </div>
      <section className="mt-4.5 rounded-[20px] border border-sky-200 bg-white p-5 shadow-lg shadow-slate-200/70">
        <p className="m-0 mb-1.75 text-[10px] font-[750] uppercase leading-[1.2] tracking-[0.14em] text-indigo-600">
          Content stays still
        </p>
        <h2 className="m-0 text-[20px] font-bold leading-[1.3] tracking-[-0.035em] text-slate-900">
          포커스해도 콘텐츠 높이는 변하지 않습니다.
        </h2>
        <p className="mt-2.5 mb-0 text-[13px] leading-[1.6] text-slate-600">
          키보드 보정은 헤더와 콘텐츠를 유지한 채 footer 위치에만 적용됩니다.
        </p>
      </section>
      <section className='h-10 bg-red-200'>

      </section>
      <div className="mt-4.5 px-3">
        <label className="sr-only" htmlFor="viewport-middle-input">콘텐츠 중간상단 입력창</label>
        <input
          className="h-11 w-full rounded-[13px] border border-slate-300 px-[13px] text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="viewport-middle-input"
          placeholder="설명과 리스트 사이 입력창"
          autoComplete="off"
          enterKeyHint="next"
        />
      </div>
      <section
        className="mt-4.5 rounded-[20px] border border-sky-200 bg-white p-4.5 shadow-lg shadow-slate-200/70"
        aria-label="스크롤 가능한 콘텐츠"
      >
        {demoRows.map((row) => (
          <div
            className="grid grid-cols-[30px_minmax(0,1fr)] gap-2.5 border-t border-t-slate-200 py-3.5"
            key={row}
          >
            <span className="font-mono text-[11px] font-bold text-indigo-600">
              {String(row).padStart(2, '0')}
            </span>
            <div>
              <strong className="text-[13px] text-slate-800">
                스크롤 가능한 콘텐츠 {row}
              </strong>
              <p className="mt-1.25 mb-0 text-[11px] leading-[1.45] text-slate-500">
                키보드가 열려도 이 콘텐츠 영역은 줄어들지 않습니다.
              </p>
            </div>
          </div>
        ))}
      </section>
      <div className="mt-4.5 px-3 pb-3">
        <label className="sr-only" htmlFor="viewport-middle-bottom-input">콘텐츠 중간하단 입력창</label>
        <input
          className="h-11 w-full rounded-[13px] border border-slate-300 px-[13px] text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="viewport-middle-bottom-input"
          placeholder="콘텐츠 중간하단 입력창"
          autoComplete="off"
          enterKeyHint="next"
        />
      </div>

      <section className='h-10 bg-red-200'>

      </section>

      <div className="mt-4.5 px-3 pb-3">
        <label className="sr-only" htmlFor="viewport-bottom-input">콘텐츠 최하단 입력창</label>
        <input
          className="h-11 w-full rounded-[13px] border border-slate-300 px-[13px] text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          id="viewport-bottom-input"
          placeholder="콘텐츠 최하단 입력창"
          autoComplete="off"
          enterKeyHint="next"
        />
      </div>
      <div className='h-10'>
        something
      </div>
    </main>
  );
}
