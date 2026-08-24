import { useI18n } from '@pkg/shared/web';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { useTermsControllerSetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

type TermsAgreementsCardProps = {
  agreements?: AgreementDto[]
  onAgreementChanged: (termId: string, isAgreed: boolean) => void
};

export function TermsAgreementsCard({ agreements = [], onAgreementChanged }: TermsAgreementsCardProps) {
  const setAgreementsMutation = useTermsControllerSetAgreements();
  const { t } = useI18n();
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  const handleToggleTerm = async (termId: string, currentAgreed: boolean) => {
    await setAgreementsMutation.mutateAsync({
      data: { agreements: [{ id: termId, isAgreed: !currentAgreed }] },
    });
    onAgreementChanged(termId, !currentAgreed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.termsStatusTitle')}</CardTitle>
        <CardDescription>
          {t('profile.termsStatusDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid divide-y border-t">
          {agreements.map((term) => {
            const isExpanded = expandedTermId === term.id;
            return (
              <div key={term.id} className="grid gap-3 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="
                      flex flex-1 items-center gap-3 cursor-pointer select-none
                      min-w-0
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
                        ? (
                          <ChevronUp className="size-4" />
                        )
                        : (
                          <ChevronDown className="size-4" />
                        )}
                    </Button>

                    <div className="grid flex-1 gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="
                          text-sm font-semibold truncate
                          hover:text-primary
                          transition-colors
                        "
                        >
                          {term.title}
                        </span>
                        <Badge
                          variant={term.isRequired ? 'destructive' : 'secondary'}
                          className="shrink-0 text-xs"
                        >
                          {term.isRequired ? t('onboarding.required') : t('onboarding.optional')}
                        </Badge>
                        <span className="
                          shrink-0 font-mono text-xs text-muted-foreground
                        "
                        >
                          {formatVersion(term.version)}
                        </span>
                      </div>

                      {term.createdAt && (
                        <p className="text-xs text-muted-foreground">
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
                    rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground
                    border
                  "
                  >
                    <pre className="
                      whitespace-pre-wrap font-sans leading-relaxed
                      text-foreground/90
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

function formatVersion(version: string) {
  return version.startsWith('v') ? version : `v${version}`;
}
