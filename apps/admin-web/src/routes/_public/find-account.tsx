import { z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Check, CheckCircle2, Copy, Mail, Phone, RefreshCw, Search, Sparkles, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerFindIdV1, useAuthControllerRequestPasswordResetV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { useHashTab } from '#/lib/use-hash-tab';

type FindAccountTab = 'id' | 'password';
type FoundAccount = { maskedEmail: string, provider: string };
const FIND_ACCOUNT_TABS: readonly FindAccountTab[] = ['id', 'password'];

export const Route = createFileRoute('/_public/find-account')({ component: FindAccountPage });

function FindAccountPage() {
  const [activeTab, setActiveTab] = useHashTab(FIND_ACCOUNT_TABS, 'id');
  const [foundAccounts, setFoundAccounts] = useState<FoundAccount[] | null>(null);
  const [passwordResetRequested, setPasswordResetRequested] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const findIdMutation = useAuthControllerFindIdV1();
  const resetMutation = useAuthControllerRequestPasswordResetV1();

  const idForm = useAppForm({
    defaultValues: { name: '', phoneNumber: '' },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, '이름을 입력해주세요.'),
        phoneNumber: z.string().min(1, '전화번호를 입력해주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      const response = await findIdMutation.mutateAsync({
        data: {
          name: value.name.trim(),
          phoneNumber: value.phoneNumber.trim(),
        },
      });
      setFoundAccounts(response.data.items.filter(isFoundAccount));
    },
  });

  const passwordForm = useAppForm({
    defaultValues: { email: '', phoneNumber: '' },
    validators: {
      onSubmit: z.object({
        email: z.email('올바른 이메일을 입력해주세요.'),
        phoneNumber: z.string().min(1, '전화번호를 입력해주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      await resetMutation.mutateAsync({
        data: {
          email: value.email.trim().toLowerCase(),
          phoneNumber: value.phoneNumber.trim(),
        },
      });
      setPasswordResetRequested(true);
    },
  });

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success('아이디가 복사되었습니다.');
      setTimeout(() => setCopiedEmail(null), 2000);
    }
    catch {
      toast.error('아이디를 복사하지 못했습니다.');
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content size="md">
        <Card className="size-full shadow-xl">
          <CardContent className="grid size-full grid-rows-[1fr] p-6">
            <div className="grid grid-rows-[auto_auto_1fr] gap-6">
              <div className="grid justify-items-center gap-2 text-center">
                <div className="
                  flex size-12 items-center justify-center rounded-2xl
                  bg-primary text-primary-foreground shadow-md
                "
                >
                  <Search className="size-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">아이디·비밀번호 찾기</h1>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as FindAccountTab)}
                className="w-full"
              >
                <TabsList className="
                  grid h-auto w-full grid-cols-2 rounded-lg bg-muted p-1
                "
                >
                  <TabsTrigger value="id">
                    아이디 찾기
                  </TabsTrigger>
                  <TabsTrigger value="password">
                    비밀번호 재설정
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <main className="grid grid-rows-[minmax(0,1fr)_auto] gap-4">
                <div className="scroll-y">
                  {activeTab === 'id' && (
                    foundAccounts
                      ? (
                        <div className="grid grid-rows-[auto_1fr_auto] gap-4">
                          <div className="
                            flex items-center gap-2 rounded-lg bg-primary/10 p-3
                            text-xs text-primary
                          "
                          >
                            <Sparkles className="size-4 shrink-0" />
                            <span>등록된 계정을 찾았습니다.</span>
                          </div>
                          <div className="grid gap-2 border-t pt-4">
                            {foundAccounts.map((account) => (
                              <div
                                key={`${account.maskedEmail}-${account.provider}`}
                                className="
                                  flex items-center justify-between rounded-lg
                                  border bg-card/60 p-3
                                "
                              >
                                <div className="grid gap-1">
                                  <span className="
                                    font-mono text-sm font-semibold
                                  "
                                  >
                                    {account.maskedEmail}
                                  </span>
                                  <span className="
                                    text-[11px] text-muted-foreground
                                  "
                                  >
                                    {account.provider === 'credential' ? '이메일 계정' : account.provider}
                                  </span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => void handleCopy(account.maskedEmail)} title="아이디 복사">
                                  {copiedEmail === account.maskedEmail
                                    ? (
                                      <Check className="size-4 text-emerald-500" />
                                    )
                                    : (
                                      <Copy className="size-4" />
                                    )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                      : (
                        <idForm.AppForm>
                          <FormLayout
                            id="find-id-form"
                            onSubmit={() => void idForm.handleSubmit()}
                            className="grid-rows-[auto_auto] gap-4"
                          >
                            <div className="grid gap-4">
                              <idForm.AppField name="name">
                                {(field) => (
                                  <field.Input
                                    label="이름"
                                    placeholder="이름을 입력해주세요."
                                    autoComplete="name"
                                    leftSide={(
                                      <User className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </idForm.AppField>
                              <idForm.AppField name="phoneNumber">
                                {(field) => (
                                  <field.Input
                                    type="tel"
                                    label="전화번호"
                                    placeholder="전화번호를 입력해주세요."
                                    autoComplete="tel"
                                    leftSide={(
                                      <Phone className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </idForm.AppField>
                            </div>
                          </FormLayout>
                        </idForm.AppForm>
                      )
                  )}

                  {activeTab === 'password' && (
                    passwordResetRequested
                      ? (
                        <div className="
                          grid grid-rows-[auto_auto] gap-4 text-center
                        "
                        >
                          <div className="grid gap-4 py-2">
                            <div className="
                              mx-auto flex size-12 items-center justify-center
                              rounded-full bg-primary/10 text-primary
                            "
                            >
                              <CheckCircle2 className="size-6" />
                            </div>
                            <div className="grid gap-1">
                              <h3 className="text-sm font-semibold">재설정 메일을 요청했습니다.</h3>
                            </div>
                          </div>
                        </div>
                      )
                      : (
                        <passwordForm.AppForm>
                          <FormLayout
                            id="find-password-form"
                            onSubmit={() => void passwordForm.handleSubmit()}
                            className="grid-rows-[auto_auto] gap-4"
                          >
                            <div className="grid gap-4">
                              <passwordForm.AppField name="email">
                                {(field) => (
                                  <field.Input
                                    type="email"
                                    label="이메일"
                                    placeholder="이메일을 입력해주세요."
                                    autoComplete="email"
                                    leftSide={(
                                      <Mail className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </passwordForm.AppField>
                              <passwordForm.AppField name="phoneNumber">
                                {(field) => (
                                  <field.Input
                                    type="tel"
                                    label="전화번호"
                                    placeholder="전화번호를 입력해주세요."
                                    autoComplete="tel"
                                    leftSide={(
                                      <Phone className="
                                        size-4 text-muted-foreground
                                      "
                                      />
                                    )}
                                    required
                                  />
                                )}
                              </passwordForm.AppField>
                            </div>
                          </FormLayout>
                        </passwordForm.AppForm>
                      )
                  )}
                </div>
                <div className="grid gap-2 border-t pt-4">
                  {activeTab === 'id' && (
                    foundAccounts
                      ? (
                        <>
                          <Button
                            type="button"
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            로그인으로 이동
                            <ArrowRight className="ml-1.5 size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFoundAccounts(null);
                              idForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="mr-1 size-3.5" />
                            다시 찾기
                          </Button>
                        </>
                      )
                      : (
                        <idForm.Subscribe selector={(state) => state.isSubmitting}>
                          {(isSubmitting) => (
                            <Button
                              type="submit"
                              form="find-id-form"
                              disabled={isSubmitting || findIdMutation.isPending}
                              className="w-full"
                            >
                              {isSubmitting ? '찾는 중...' : '아이디 찾기'}
                              <ArrowRight className="ml-1.5 size-4" />
                            </Button>
                          )}
                        </idForm.Subscribe>
                      )
                  )}
                  {activeTab === 'password' && (
                    passwordResetRequested
                      ? (
                        <>
                          <Button
                            type="button"
                            render={<Link to="/login" />}
                            className="w-full"
                          >
                            로그인으로 이동
                            <ArrowRight className="ml-1.5 size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPasswordResetRequested(false);
                              passwordForm.reset();
                            }}
                            className="w-full text-xs text-muted-foreground"
                          >
                            <RefreshCw className="mr-1 size-3.5" />
                            다시 요청
                          </Button>
                        </>
                      )
                      : (
                        <passwordForm.Subscribe selector={(state) => state.isSubmitting}>
                          {(isSubmitting) => (
                            <Button
                              type="submit"
                              form="find-password-form"
                              disabled={isSubmitting || resetMutation.isPending}
                              className="w-full"
                            >
                              {isSubmitting ? '보내는 중...' : '비밀번호 재설정 링크 받기'}
                              <ArrowRight className="ml-1.5 size-4" />
                            </Button>
                          )}
                        </passwordForm.Subscribe>
                      )
                  )}
                </div>
              </main>
            </div>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>
        <Link
          to="/login"
          className="
            text-xs text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          ← 로그인으로 돌아가기
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}

function isFoundAccount(value: unknown): value is FoundAccount {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.maskedEmail === 'string' && typeof record.provider === 'string';
}
