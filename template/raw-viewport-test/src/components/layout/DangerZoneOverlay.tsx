export interface DangerZoneOverlayProps {
  show: boolean;
}

export function DangerZoneOverlay({ show }: DangerZoneOverlayProps) {
  if (!show) return null;

  return (
    <>
      {/* 🔴 Notch Danger Zone Visualizer */}
      <div
        className="fixed inset-x-0 top-0 z-50 pointer-events-none border-b border-red-500/60 bg-red-500/20 overflow-visible"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-red-500 bg-background/95 border border-red-500/40 px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>NOTCH / STATUS BAR</span>
        </div>
      </div>

      {/* 🔵 Home Bar Danger Zone Visualizer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 pointer-events-none border-t border-blue-500/60 bg-blue-500/20 overflow-visible"
        style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-blue-500 bg-background/95 border border-blue-500/40 px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>HOME BAR / NAVIGATION BAR</span>
        </div>
      </div>
    </>
  );
}


