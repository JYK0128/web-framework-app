import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getTermsControllerGetAgreementsV1QueryKey, useTermsControllerSetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox } from '#/.generated/shadcn/components/ui';
import { AppIcon } from '#/components/app';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_protected/onboarding/terms')({
  component: TermsOnboardingPage,
});

function TermsOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { agreements } = Route.useRouteContext();
  const [checked, setChecked] = useState<Record<string, boolean>>(() => (
    Object.fromEntries(agreements.map((term) => [term.id, term.isAgreed]))
  ));
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);
  const agreeMutation = useTermsControllerSetAgreementsV1();

  const requiredTerms = useMemo(
    () => agreements.filter((term) => term.isRequired),
    [agreements],
  );
  const allRequiredChecked = requiredTerms.every((term) => checked[term.id]);

  const handleToggleAll = (value: boolean) => {
    setChecked((current) => ({
      ...current,
      ...Object.fromEntries(requiredTerms.map((term) => [term.id, value])),
    }));
  };

  const handleSubmit = async () => {
    await agreeMutation.mutateAsync({
      data: {
        agreements: requiredTerms.map((term) => ({
          id: term.id,
          isAgreed: checked[term.id] === true,
        })),
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getTermsControllerGetAgreementsV1QueryKey(),
    });
    await navigate({ to: '/profile', replace: true });
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AppIcon name="shield-check" className="size-5 text-primary" />
              <CardTitle>관리자 온보딩</CardTitle>
            </div>
            <CardDescription>
              관리자 시스템을 사용하기 전에 필수 약관에 동의해 주세요.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 scroll-y">
            <label className="
              flex items-start gap-3 rounded-lg border bg-muted/30 p-4
            "
            >
              <Checkbox
                checked={allRequiredChecked}
                onCheckedChange={(value) => handleToggleAll(Boolean(value))}
                aria-label="필수 약관 전체 동의"
              />
              <span className="grid gap-1">
                <span className="font-semibold">필수 약관 전체 동의</span>
                <span className="text-sm text-muted-foreground">
                  아래 필수 약관을 모두 확인하고 동의합니다.
                </span>
              </span>
            </label>

            <div className="grid gap-2">
              {requiredTerms.map((term) => {
                const isExpanded = expandedTermId === term.id;
                return (
                  <div key={term.id} className="rounded-lg border">
                    <div className="flex items-center gap-3 p-4">
                      <Checkbox
                        checked={Boolean(checked[term.id])}
                        onCheckedChange={(value) => setChecked((current) => ({
                          ...current,
                          [term.id]: Boolean(value),
                        }))}
                        aria-label={`${term.title} 동의`}
                      />
                      <button
                        type="button"
                        className="
                          flex min-w-0 flex-1 items-center justify-between gap-3
                          text-left
                        "
                        onClick={() => setExpandedTermId(isExpanded ? null : term.id)}
                      >
                        <span className="truncate font-medium">{term.title}</span>
                        <ChevronDown className={`
                          size-4 shrink-0 transition-transform
                          ${isExpanded
                    ? `rotate-180`
                    : ''}
                        `}
                        />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="
                        border-t bg-muted/20 p-4 text-sm/6 text-muted-foreground
                        whitespace-pre-wrap
                      "
                      >
                        {term.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full gap-2"
              disabled={!allRequiredChecked || agreeMutation.isPending}
              onClick={() => void handleSubmit()}
            >
              {agreeMutation.isPending
                ? <Loader2 className="size-4 animate-spin" />
                : <Check className="size-4" />}
              동의하고 계속하기
            </Button>
          </CardFooter>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>관리자 약관 동의</ScreenLayout.Addon>
    </ScreenLayout>
  );
}
