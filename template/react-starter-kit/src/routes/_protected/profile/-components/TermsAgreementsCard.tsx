import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';

type TermsAgreementsCardProps = {
  agreements?: AgreementDto[]
};

export function TermsAgreementsCard({ agreements = [] }: TermsAgreementsCardProps) {
  const { mutateAsync: setAgreements } = useTermsControllerSetAgreements();
  const { t } = useI18n();
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  const handleToggleTerm = async (termId: string, currentAgreed: boolean) => {
    await setAgreements({
      data: { agreements: [{ id: termId, isAgreed: !currentAgreed }] },
    });
    toast.success(t('profile.termsChanged'));
  };

  return (
    <Card className="p-6">
      <CardContent className="grid gap-6 p-0">
        <div className="grid gap-1">
          <h3 className="text-base font-bold">{t('profile.termsStatusTitle')}</h3>
          <p className="text-xs text-muted-foreground">
            {t('profile.termsStatusDescription')}
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
                          {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
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
                          {t('profile.statusChangedAt')}
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
                    {term.isAgreed ? t('profile.agreementComplete') : t('profile.notAgreed')}
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
                      {term.content || t('profile.noTermContent')}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {agreements.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t('profile.noTerms')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
