import type { ReactNode } from 'react';

function SideMainLayoutSide({ children }: { children: ReactNode }) {
  return (
    <div className="
      grid w-full grid-rows-[minmax(0,1fr)]
      lg:w-80 lg:shrink-0
    "
    >
      {children}
    </div>
  );
}

function SideMainLayoutMain({ children }: { children: ReactNode }) {
  return (
    <div className="
      grid w-full flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden
      lg:w-0
    "
    >
      {children}
    </div>
  );
}

function SideMainLayoutComponent({ children }: { children: ReactNode }) {
  return (
    <div className="
      flex size-full flex-col gap-6 p-2
      lg:flex-row
    "
    >
      {children}
    </div>
  );
}

export const SideMainLayout = Object.assign(SideMainLayoutComponent, {
  Side: SideMainLayoutSide,
  Main: SideMainLayoutMain,
});
