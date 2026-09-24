import { z } from '@pkg/shared/common';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { type ModalComponentProps } from '#/components/modal';

import type { OAuthProviderMeta } from './oauth-provider.types';

export interface OAuthProviderAddDialogProps extends ModalComponentProps<OAuthProviderMeta | null> {
  registeredKeys: string[]
}

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, '색상을 선택해 주세요.');

export function OAuthProviderAddDialog({ open, onOpenChange, close, registeredKeys }: OAuthProviderAddDialogProps) {
  const form = useAppForm({
    defaultValues: {
      providerId: '',
      providerName: '',
      providerScope: '',
      authorizeUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      revokeUrl: '',
      brandColor: '#ffffff',
      brandTextColor: '#000000',
      iconFiles: [] as File[],
    },
    validators: {
      onSubmit: z.object({
        providerId: z.string().trim().min(1, '서비스 식별자를 입력해 주세요.'),
        providerName: z.string().trim().min(1, '표시 이름을 입력해 주세요.'),
        providerScope: z.string(),
        authorizeUrl: z.string(),
        tokenUrl: z.string(),
        userInfoUrl: z.string(),
        revokeUrl: z.string(),
        brandColor: colorSchema,
        brandTextColor: colorSchema,
        iconFiles: z.array(z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)).min(1, '아이콘 이미지를 선택해 주세요.'),
      }),
    },
    onSubmit: ({ value }) => {
      const cleanId = value.providerId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!cleanId) {
        toast.error('영문 소문자, 숫자, 하이픈(-), 밑줄(_)로 식별자를 입력해 주세요.');
        return;
      }
      if (registeredKeys.includes(cleanId)) {
        toast.error('이미 등록된 서비스입니다.');
        return;
      }
      close?.({
        id: cleanId,
        name: value.providerName.trim(),
        defaultScope: value.providerScope.trim(),
        authorizeUrl: value.authorizeUrl.trim(),
        tokenUrl: value.tokenUrl.trim(),
        userInfoUrl: value.userInfoUrl.trim(),
        revokeUrl: value.revokeUrl.trim(),
        brandColor: value.brandColor,
        brandTextColor: value.brandTextColor,
        iconFiles: value.iconFiles,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        max-h-[calc(100vh-2rem)] max-w-md grid-rows-[auto_minmax(0,1fr)]
        overflow-hidden
      "
      >
        <DialogHeader>
          <DialogTitle>서비스 추가</DialogTitle>
          <DialogDescription>OAuth 2.0 제공자의 연결 정보와 로그인 버튼 모양을 입력하세요. 아이콘은 설정 저장 시 업로드됩니다.</DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="
              grid grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden
            "
          >
            <div className="scroll-y grid gap-4 py-2 pr-1">
              <form.AppField name="providerId">
                {(field) => (
                  <field.Input
                    label="서비스 식별자 (ID)"
                    placeholder="예: okta, keycloak"
                    className="font-mono text-sm"
                    required
                    autoFocus
                  />
                )}
              </form.AppField>
              <p className="text-xs text-muted-foreground">영문 소문자, 숫자, 하이픈(-), 밑줄(_)을 사용할 수 있으며 콜백 URL 식별자로 사용됩니다.</p>
              <form.AppField name="authorizeUrl">
                {(field) => (
                  <field.Input
                    label="Authorize endpoint"
                    placeholder="https://example.com/oauth/authorize"
                    className="font-mono text-xs"
                  />
                )}
              </form.AppField>
              <form.AppField name="tokenUrl">
                {(field) => (
                  <field.Input
                    label="Token endpoint"
                    placeholder="https://example.com/oauth/token"
                    className="font-mono text-xs"
                  />
                )}
              </form.AppField>
              <form.AppField name="userInfoUrl">
                {(field) => (
                  <field.Input
                    label="User info endpoint"
                    placeholder="https://example.com/userinfo"
                    className="font-mono text-xs"
                  />
                )}
              </form.AppField>
              <form.AppField name="revokeUrl">
                {(field) => (
                  <field.Input
                    label="Revoke endpoint (optional)"
                    placeholder="https://example.com/oauth/revoke"
                    className="font-mono text-xs"
                  />
                )}
              </form.AppField>
              <form.AppField name="providerName">{(field) => <field.Input label="서비스 표시 이름" placeholder="예: Okta SSO" required />}</form.AppField>
              <form.AppField name="providerScope">{(field) => <field.Input label="요청 권한 (Scope)" placeholder="openid profile email" />}</form.AppField>
              <form.AppField name="iconFiles">{(field) => <field.FileInput label="프로바이더 아이콘" accept="image/png,image/jpeg,image/webp" uploadTiming="onSubmit" required />}</form.AppField>
              <div className="grid grid-cols-2 gap-3">
                <form.AppField name="brandColor">
                  {(field) => (
                    <field.Input
                      type="color"
                      label="배경색"
                      className="h-9 w-16 cursor-pointer p-1"
                      required
                    />
                  )}
                </form.AppField>
                <form.AppField name="brandTextColor">
                  {(field) => (
                    <field.Input
                      type="color"
                      label="텍스트색"
                      className="h-9 w-16 cursor-pointer p-1"
                      required
                    />
                  )}
                </form.AppField>
              </div>
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => close?.(null)}>취소</Button>
              <FormSubmit>
                <Plus className="size-4" />
                서비스 추가
              </FormSubmit>
            </DialogFooter>
          </FormLayout>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
