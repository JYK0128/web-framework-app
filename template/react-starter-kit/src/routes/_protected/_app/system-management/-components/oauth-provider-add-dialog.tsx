import { Plus } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';
import type { OAuthProviderMeta } from '#/routes/_protected/_app/system-management/-configs/oauth-catalog';

export interface OAuthProviderAddDialogProps
  extends DialogComponentProps<OAuthProviderMeta | null> {
  registeredKeys: string[]
}

export function OAuthProviderAddDialog({
  open,
  onOpenChange,
  close,
  registeredKeys,
}: OAuthProviderAddDialogProps) {
  const { t } = useI18n();

  const [providerId, setProviderId] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerScope, setProviderScope] = useState('');
  const [authorizeUrl, setAuthorizeUrl] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [userInfoUrl, setUserInfoUrl] = useState('');
  const [revokeUrl, setRevokeUrl] = useState('');
  const [providerResource, setProviderResource] = useState('');

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanId = providerId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanName = providerName.trim();

    if (!cleanId || !cleanName) {
      toast.error(t('systemManagement.validationError'));
      return;
    }

    if (registeredKeys.includes(cleanId)) {
      toast.error(t('systemManagement.oauth.presetRegistered'));
      return;
    }

    const meta: OAuthProviderMeta = {
      id: cleanId,
      name: cleanName,
      defaultScope: providerScope.trim(),
      resource: providerResource.trim(),
      authorizeUrl: authorizeUrl.trim(),
      tokenUrl: tokenUrl.trim(),
      userInfoUrl: userInfoUrl.trim(),
      revokeUrl: revokeUrl.trim(),
    };

    close?.(meta);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('systemManagement.oauth.addProvider')}</DialogTitle>
          <DialogDescription>
            OAuth 2.0 제공자의 연결 정보를 직접 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="providerId" className="text-xs font-semibold">
              {t('systemManagement.oauth.customId')}
            </Label>
            <Input
              id="providerId"
              placeholder={t('systemManagement.oauth.customIdPlaceholder')}
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="font-mono text-sm"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              영문 소문자, 숫자, 하이픈(-)만 사용할 수 있으며, 콜백 URL 식별자로 사용됩니다.
            </p>
          </div>

          {([
            { id: 'authorizeUrl', label: 'Authorize endpoint', value: authorizeUrl, setter: setAuthorizeUrl },
            { id: 'tokenUrl', label: 'Token endpoint', value: tokenUrl, setter: setTokenUrl },
            { id: 'userInfoUrl', label: 'User info endpoint', value: userInfoUrl, setter: setUserInfoUrl },
            { id: 'revokeUrl', label: 'Revoke endpoint (optional)', value: revokeUrl, setter: setRevokeUrl },
          ] as const).map(({ id, label, value, setter }) => (
            <div key={id} className="space-y-1.5">
              <Label htmlFor={id} className="text-xs font-semibold">{label}</Label>
              <Input
                id={id}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="providerName" className="text-xs font-semibold">
              {t('systemManagement.oauth.customName')}
            </Label>
            <Input
              id="providerName"
              placeholder={t('systemManagement.oauth.customNamePlaceholder')}
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="providerScope" className="text-xs font-semibold">
              {t('systemManagement.oauth.scope')}
            </Label>
            <Input
              id="providerScope"
              placeholder="openid profile email"
              value={providerScope}
              onChange={(e) => setProviderScope(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="providerResource" className="text-xs font-semibold">
              버튼 리소스 (SVG / HTML 마크업)
            </Label>
            <Textarea
              id="providerResource"
              placeholder="<svg ...>...</svg> 또는 <img src='...' />"
              value={providerResource}
              onChange={(e) => setProviderResource(e.target.value)}
              className="font-mono text-xs h-20 resize-none"
            />
            {providerResource.trim() && (
              <div className="
                mt-1 p-2 rounded-sm border bg-muted/40 flex items-center
                justify-center min-h-10
              "
              >
                <div
                  className="
                    max-h-8 flex items-center justify-center
                    [&_svg]:max-h-8 [&_svg]:w-auto
                    [&_img]:max-h-8 [&_img]:w-auto
                  "
                  dangerouslySetInnerHTML={{ __html: providerResource }}
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => close?.(null)}
            >
              {t('app.dialog.cancel')}
            </Button>
            <Button type="submit" className="gap-1.5 cursor-pointer">
              <Plus className="size-4" />
              <span>{t('systemManagement.oauth.addProvider')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
