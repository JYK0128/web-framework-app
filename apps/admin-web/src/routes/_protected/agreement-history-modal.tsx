import { DateUtil } from '@pkg/shared/common';
import { ArrowLeft, History, X } from 'lucide-react';
import { useState } from 'react';

import { useTermsControllerGetAgreementHistoryV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementHistoryItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import type { ModalComponentProps } from '#/components/modal';

type AgreementHistoryModalProps = ModalComponentProps & {
  term: TermAgreementItemDto
};

export function AgreementHistoryModal({ term, open, onOpenChange }: AgreementHistoryModalProps) {
  const [selectedItem, setSelectedItem] = useState<AgreementHistoryItemDto | null>(null);
  const { data, isLoading } = useTermsControllerGetAgreementHistoryV1(
    { limit: 100, sort: ['createdAt'], direction: ['desc'] },
    { query: { enabled: Boolean(open) } },
  );
  const history = data?.data.items.filter((item) => item.code === term.code) ?? [];
  const close = () => onOpenChange?.(false);

  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4
      "
      role="presentation"
    >
      <section
        aria-labelledby="agreement-history-title"
        aria-modal="true"
        className="
          grid max-h-[min(720px,calc(100vh-2rem))] w-full max-w-2xl
          grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border
          bg-background shadow-2xl
        "
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div className="flex items-start gap-3">
            {selectedItem && (
              <Button variant="ghost" size="icon" aria-label="목록으로" onClick={() => setSelectedItem(null)}>
                <ArrowLeft />
              </Button>
            )}
            <div className="grid gap-1">
              <h2
                id="agreement-history-title"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <History className="size-5" />
                {selectedItem ? selectedItem.title : `${term.title} 동의 이력`}
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                {selectedItem?.version ?? term.version}
                {' '}
                ·
                {term.code}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="닫기" onClick={close}>
            <X />
          </Button>
        </header>

        <div className="scroll-y p-5">
          {selectedItem
            ? <HistoryDetail item={selectedItem} />
            : (
              <div className="grid gap-2">
                {isLoading && <p className="text-sm text-muted-foreground">이력을 불러오는 중입니다.</p>}
                {!isLoading && history.length === 0 && (
                  <p className="text-sm text-muted-foreground">동의 이력이 없습니다.</p>
                )}
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="
                      flex items-center justify-between gap-4 rounded-lg border
                      p-3 text-left
                      hover:bg-muted/50
                    "
                    onClick={() => setSelectedItem(item)}
                  >
                    <span className="grid gap-1">
                      <span className="font-medium">{item.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {DateUtil.dateTime.formatLocale(item.createdAt)}
                      </span>
                    </span>
                    <span className={item.isAgreed
                      ? `text-sm font-medium text-primary`
                      : `text-sm text-muted-foreground`}
                    >
                      {item.isAgreed ? '동의' : '철회'}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </div>

        <footer className="flex justify-end border-t p-4">
          <Button variant="outline" onClick={close}>닫기</Button>
        </footer>
      </section>
    </div>
  );
}

function HistoryDetail({ item }: { item: AgreementHistoryItemDto }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-md border px-2 py-1">{item.isRequired ? '필수' : '선택'}</span>
        <span className="rounded-md border px-2 py-1">{item.isAgreed ? '동의' : '철회'}</span>
        <span className="py-1 text-muted-foreground">{DateUtil.dateTime.formatLocale(item.createdAt)}</span>
      </div>
      <div className="
        max-h-96 scroll-y whitespace-pre-wrap rounded-md border bg-muted/20 p-4
        text-sm/6
      "
      >
        {item.content}
      </div>
    </div>
  );
}
