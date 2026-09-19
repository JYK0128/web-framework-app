import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';
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
      <section aria-label="약관 상세" aria-modal="true" className="w-full max-w-2xl" role="dialog">
        <SectionCard icon="file-text" title={term.title} description={`${term.code} · v${term.version}`}>
          <SectionCard.Actions>
            <Button variant="outline" size="sm" onClick={close}>닫기</Button>
          </SectionCard.Actions>
          <SectionCard.Content className="
            max-h-[min(600px,calc(100vh-12rem))] scroll-y whitespace-pre-wrap
            p-5 text-sm/6
          "
          >
            {term.content}
          </SectionCard.Content>
        </SectionCard>
      </section>
    </div>
  );
}
