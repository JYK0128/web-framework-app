import { X } from 'lucide-react';

import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import type { ModalComponentProps } from '#/components/modal';

type TermDetailModalProps = ModalComponentProps & {
  term: TermAgreementItemDto
};

export function TermDetailModal({ term, open, onOpenChange }: TermDetailModalProps) {
  const close = () => onOpenChange?.(false);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4
      "
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        aria-labelledby="term-detail-title"
        aria-modal="true"
        className="
          grid max-h-[min(720px,calc(100vh-2rem))] w-full max-w-2xl
          grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border
          bg-background shadow-2xl
        "
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div className="grid gap-1">
            <h2 id="term-detail-title" className="text-lg font-semibold">{term.title}</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {term.code}
              {' '}
              · v
              {term.version}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="닫기" onClick={close}>
            <X />
          </Button>
        </header>
        <div className="scroll-y whitespace-pre-wrap p-5 text-sm/6">
          {term.content}
        </div>
        <footer className="flex justify-end border-t p-4">
          <Button variant="outline" onClick={close}>닫기</Button>
        </footer>
      </section>
    </div>
  );
}
