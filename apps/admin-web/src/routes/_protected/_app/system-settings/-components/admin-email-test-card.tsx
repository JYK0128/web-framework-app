import { z } from '@pkg/shared/common';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import type { SystemConfigControllerTestAdminEmailV1200 } from '#/.generated/api/model/systemConfigControllerTestAdminEmailV1200';
import type { TestAdminEmailRequestDto } from '#/.generated/api/model/testAdminEmailRequestDto';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/lib/axios';

export function AdminEmailTestCard() {
  const testMutation = useMutation({
    mutationFn: (to: string) => axios<SystemConfigControllerTestAdminEmailV1200>({
      url: `${API_PREFIX}/system-config/test-email`,
      method: 'POST',
      data: { to } satisfies TestAdminEmailRequestDto,
    }),
    meta: { successMessage: '테스트 메일을 발송했습니다.' },
  });

  const form = useAppForm({
    defaultValues: { to: '' },
    validators: {
      onSubmit: z.object({ to: z.email('올바른 수신 이메일 주소를 입력해 주세요.') }),
    },
    onSubmit: async ({ value }) => testMutation.mutateAsync(value.to),
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => void form.handleSubmit()}
        className="grid gap-4"
      >
        <SectionCard icon="mail" title="관리자 이메일 발송 테스트" description="저장된 관리자 SMTP 설정으로 테스트 메일을 발송합니다." variant="ghost" textSize="base">
          <SectionCard.Content className="
            grid gap-3
            sm:grid-cols-[1fr_auto] sm:items-end
          "
          >
            <form.AppField name="to">
              {(field) => <field.Input type="email" label="테스트 수신 주소" placeholder="operator@example.com" autoComplete="email" />}
            </form.AppField>
            <FormSubmit disabled={testMutation.isPending}>
              <Send className="size-4" />
              {testMutation.isPending ? '발송 중...' : '테스트 발송'}
            </FormSubmit>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </form.AppForm>
  );
}
