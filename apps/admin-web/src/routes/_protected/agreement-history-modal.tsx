import { DateUtil } from '@pkg/shared/common';
import { ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';

import { useTermsControllerGetAgreementHistoryV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementHistoryItemDto, TermAgreementItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
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
        aria-label="약관 동의 이력"
        aria-modal="true"
        className="w-full max-w-2xl"
        role="dialog"
      >
        <SectionCard
          icon="file-text"
          title={selectedItem ? selectedItem.title : `${term.title} 동의 이력`}
          description={`${selectedItem?.version ?? term.version} · ${term.code}`}
        >
          <SectionCard.Actions>
            {selectedItem && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                <ArrowLeft />
                목록
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={close}>
              <X />
              닫기
            </Button>
          </SectionCard.Actions>
          <SectionCard.Content className="
            max-h-[min(600px,calc(100vh-12rem))] scroll-y p-5
          "
          >
            {selectedItem
              ? <HistoryDetail item={selectedItem} />
              : (
                <div className="grid gap-2">
                  {isLoading && <p className="text-sm text-muted-foreground">이력을 불러오는 중입니다.</p>}
                  {!isLoading && history.length === 0 && (
                    <p className="text-sm text-muted-foreground">동의 이력이 없습니다.</p>
                  )}
                  {history.map((item) => (
                    <ActionCard
                      key={item.id}
                      icon="file-text"
                      title={`${item.version} · ${item.isAgreed ? '동의' : '철회'}`}
                      description={DateUtil.dateTime.formatLocale(item.createdAt)}
                      variant="outline"
                    >
                      <ActionCard.Actions>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedItem(item)}>
                          내용 보기
                        </Button>
                      </ActionCard.Actions>
                    </ActionCard>
                  ))}
                </div>
              )}
          </SectionCard.Content>
        </SectionCard>
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
