import { useNavigate } from '@tanstack/react-router';
import { CircleAlert, CircleCheck, ExternalLink } from 'lucide-react';

import { useAuthControllerGetPolicyV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { SectionCard } from '#/components/layout';

const portoneSettings = [
  { label: '스토어 ID', configured: Boolean(import.meta.env.VITE_PORTONE_STORE_ID) },
  { label: '본인인증 채널 키', configured: Boolean(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY) },
];

export function PortoneIdentityTool() {
  const navigate = useNavigate();
  const policyQuery = useAuthControllerGetPolicyV1();
  const settings = portoneSettings;
  const isConfigured = policyQuery.isSuccess && settings.every((setting) => setting.configured);

  return (
    <SectionCard
      icon="shield-check"
      title="PortOne 본인인증"
      description="본인인증에 필요한 브라우저 설정을 확인하고 기존 인증 화면을 실행합니다."
      variant="ghost"
      textSize="base"
    >
      <SectionCard.Content className="grid gap-3">
        <div className="
          grid gap-2
          sm:grid-cols-2
        "
        >
          {settings.map(({ label, configured }) => (
            <div
              key={label}
              className="
                flex items-center gap-2 rounded-md border px-3 py-2 text-sm
              "
            >
              {configured
                ? <CircleCheck className="size-4 text-emerald-600" />
                : <CircleAlert className="size-4 text-destructive" />}
              <span>{label}</span>
              <span className="ml-auto text-muted-foreground">{configured ? '설정됨' : '설정 필요'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          인증 성공 시 현재 로그인한 운영자 계정의 전화번호 인증 상태가 반영됩니다.
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={!isConfigured}
            onClick={() => void navigate({ to: '/profile' })}
          >
            <ExternalLink className="mr-2 size-4" />
            내 프로필에서 본인인증
          </Button>
        </div>
      </SectionCard.Content>
    </SectionCard>
  );
}
