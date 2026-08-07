import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getTermsControllerGetAgreementsQueryKey } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

type TermsAgreementsCardProps = {
  agreements?: AgreementDto[]
};

export function TermsAgreementsCard({ agreements = [] }: TermsAgreementsCardProps) {
  const queryClient = useQueryClient();
  const { setAgreements } = useAuth();
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  const handleToggleTerm = async (termId: string, currentAgreed: boolean) => {
    await setAgreements({
      agreements: [{ id: termId, isAgreed: !currentAgreed }],
    });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAgreementsQueryKey() });
    toast.success('약관 동의 상태가 성공적으로 변경되었습니다.');
  };

  return (
    <Card className="p-6">
      <CardContent className="grid gap-6 p-0">
        <div className="grid gap-1">
          <h3 className="text-base font-bold">약관 동의 상태 관리</h3>
          <p className="text-xs text-muted-foreground">
            서비스 이용약관 및 개인정보 처리방침 등 동의 내역을 확인하고 선택 약관 동의를 변경할 수 있습니다. 각 약관 항목을 클릭하면 세부 내용을 펼쳐볼 수 있습니다.
          </p>
        </div>

        <div className="grid divide-y border-t">
          {agreements.map((term) => {
            const isExpanded = expandedTermId === term.id;
            return (
              <div key={term.id} className="grid gap-3 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="
                      flex flex-1 items-center gap-3 cursor-pointer select-none
                    "
                    onClick={() => setExpandedTermId(isExpanded ? null : term.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0"
                      tabIndex={-1}
                    >
                      {isExpanded
                        ? <ChevronUp className="size-4" />
                        : (
                          <ChevronDown className="size-4" />
                        )}
                    </Button>

                    <div className="grid flex-1 gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="
                          text-sm font-bold
                          hover:text-orange-600
                          transition-colors
                        "
                        >
                          {term.title}
                        </span>
                        <Badge
                          variant={term.isRequired ? 'destructive' : 'secondary'}
                          className="shrink-0 text-2xs"
                        >
                          {term.isRequired ? '필수' : '선택'}
                        </Badge>
                        <span className="
                          shrink-0 font-mono text-2xs text-muted-foreground
                        "
                        >
                          v
                          {term.version}
                        </span>
                      </div>

                      {term.createdAt && (
                        <p className="text-2xs text-muted-foreground">
                          상태 변경 일시:
                          {' '}
                          {format(new Date(term.createdAt), 'yyyy.MM.dd HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="shrink-0"
                    variant={term.isAgreed ? 'secondary' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleTerm(term.id, term.isAgreed);
                    }}
                  >
                    {term.isAgreed ? '동의 완료' : '미동의'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="
                    rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground
                    border border-border/50 transition-all
                  "
                  >
                    <pre className="
                      whitespace-pre-wrap font-sans leading-relaxed
                      text-zinc-700
                      dark:text-zinc-300
                    "
                    >
                      {term.content || '약관 세부 내용이 없습니다.'}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {agreements.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              등록된 약관 항목이 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
