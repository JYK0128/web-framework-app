import type { ComponentPropsWithoutRef } from 'react';

export type HeaderProps = ComponentPropsWithoutRef<'header'>;

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header {...props} className={className}>
      {children ?? (
        <>
          <p className="m-0 mb-[7px] text-[10px] font-[750] uppercase leading-[1.2] tracking-[0.14em] text-indigo-600">
            Footer keyboard test
          </p>
          <h1 className="m-0 text-[22px] font-[720] tracking-[-0.035em] text-slate-900">
            iOS 키보드 테스트
          </h1>
        </>
      )}
    </header>
  );
}
