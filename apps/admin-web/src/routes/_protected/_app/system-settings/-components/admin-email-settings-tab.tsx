import { z } from '@pkg/shared/common';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';

import type { AdminEmailConfigResponseDto } from '#/.generated/api/model/adminEmailConfigResponseDto';
import type { SystemConfigControllerTestAdminEmailV1200 } from '#/.generated/api/model/systemConfigControllerTestAdminEmailV1200';
import type { UpdateAdminEmailConfigRequestDto } from '#/.generated/api/model/updateAdminEmailConfigRequestDto';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { API_PREFIX } from '#/configs/app.config';
import { axios } from '#/lib/axios';

export interface AdminEmailSettingsTabProps {
  adminEmail?: AdminEmailConfigResponseDto
}

export interface AdminEmailSettingsTabHandle {
  submitData: () => Promise<UpdateAdminEmailConfigRequestDto | null>
}

export const AdminEmailSettingsTab = forwardRef<AdminEmailSettingsTabHandle, AdminEmailSettingsTabProps>(function AdminEmailSettingsTab({ adminEmail }, ref) {
  const smtpPasswordConfigured = adminEmail?.smtpPasswordConfigured ?? false;
  const testMutation = useMutation({
    mutationFn: (to: string) => axios<SystemConfigControllerTestAdminEmailV1200>({
      url: `${API_PREFIX}/system-config/test-email`,
      method: 'POST',
      data: { to },
    }),
    onSuccess: (response) => toast.success(response.message),
  });
  const emailForm = useAppForm({
    defaultValues: {
      smtpHost: adminEmail?.smtpHost ?? '',
      smtpPort: adminEmail?.smtpPort ?? 587,
      smtpSecure: adminEmail?.smtpSecure ?? true,
      smtpUser: adminEmail?.smtpUser ?? '',
      smtpPassword: '',
      from: adminEmail?.from ?? '',
    },
    validators: {
      onSubmit: z.object({
        smtpHost: z.string().trim().min(1, 'SMTP 서버 주소를 입력해 주세요.').max(255),
        smtpPort: z.number().int().min(1).max(65535),
        smtpSecure: z.boolean(),
        smtpUser: z.string().trim().min(1, 'SMTP 계정을 입력해 주세요.').max(255),
        smtpPassword: smtpPasswordConfigured
          ? z.string().max(500)
          : z.string().min(1, 'SMTP 비밀번호를 입력해 주세요.').max(500),
        from: z.email('올바른 발신 이메일 주소를 입력해 주세요.').max(255),
      }),
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await emailForm.validateAllFields('submit');
      if (!isValid) return null;
      const { smtpPassword, ...settings } = emailForm.state.values;
      return { ...settings, ...(smtpPassword ? { smtpPassword } : {}) };
    },
  }));

  const handleTestEmail = () => {
    const from = emailForm.state.values.from.trim();
    const match = /^[^<]*<([^>]*)>/.exec(from);
    const recipient = match?.[1].trim() ?? from;
    if (!recipient) {
      toast.error('기본 발신 주소를 입력해 주세요.');
      return;
    }
    testMutation.mutate(recipient);
  };

  return (
    <emailForm.AppForm>
      <FormLayout
        id="admin-email-settings-form"
        onSubmit={() => void emailForm.handleSubmit()}
        className="grid gap-4"
      >
        <SectionCard
          icon="mail"
          title="관리자 이메일"
          description="관리자 계정 복구 메일에 사용할 발신 주소와 SMTP 서버를 설정합니다. 테스트 메일은 발신 주소로 전송됩니다."
          variant="ghost"
          textSize="base"
        >
          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <div className="
              relative col-span-full flex items-center gap-2 pr-30
            "
            >
              <emailForm.AppField name="from">
                {(field) => <field.Input label="기본 발신 주소" placeholder="admin@example.com" autoComplete="email" required />}
              </emailForm.AppField>
              <Button
                type="button"
                variant="outline"
                className="anchor-position-[--from] ml-2"
                disabled={testMutation.isPending}
                onClick={handleTestEmail}
              >
                <Send className="mr-1.5 size-3.5" />
                {testMutation.isPending ? '...' : '테스트 발송'}
              </Button>
            </div>
            <div className="
              relative col-span-full flex items-center gap-2 pr-30
            "
            >
              <emailForm.AppField name="smtpHost">
                {(field) => <field.Input label="SMTP 호스트 서버 주소" placeholder="smtp.gmail.com / email-smtp.amazonaws.com" autoComplete="url" required />}
              </emailForm.AppField>
              <emailForm.AppField name="smtpPort">
                {(field) => (
                  <div className="w-20 shrink-0">
                    <field.Input type="number" min={1} max={65535} label="SMTP 포트" placeholder="587" required />
                  </div>
                )}
              </emailForm.AppField>
              <div className="anchor-position-[--smtpPort] ml-2">
                <emailForm.AppField name="smtpSecure">
                  {(field) => <field.Switch showError={false} label="보안 연결" />}
                </emailForm.AppField>
              </div>
            </div>
            <div className="
              relative col-span-full flex flex-col gap-2
              md:flex-row
            "
            >
              <emailForm.AppField name="smtpUser">
                {(field) => <field.Input label="SMTP 인증 계정" placeholder="user@example.com / SMTP Username" autoComplete="username" required />}
              </emailForm.AppField>
              <emailForm.AppField name="smtpPassword">
                {(field) => <field.Input type="password" label="SMTP 인증 비밀번호" placeholder={smtpPasswordConfigured ? '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.' : 'SMTP 비밀번호를 입력해 주세요.'} autoComplete="new-password" required={!smtpPasswordConfigured} />}
              </emailForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </emailForm.AppForm>
  );
});
