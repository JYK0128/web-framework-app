import { fetchToCurl } from '@pkg/shared/common';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import type { LogItemDto } from '#/.generated/api/model';
import { Button, TabsContent } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

interface LogRequestTabProps {
  log: LogItemDto
}

export function LogRequestTab({ log }: LogRequestTabProps) {
  const { t } = useI18n();
  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content);
    toast.success(t('logManagement.detail.copied'));
  };
  const hasBody = Boolean(log.requestBody && Object.keys(log.requestBody).length > 0);
  const body = log.requestBody ? JSON.stringify(log.requestBody, null, 2) : '';
  const curl = fetchToCurl(log.url, {
    method: log.method,
    headers: {
      ...(log.userAgent ? { 'User-Agent': log.userAgent } : {}),
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? body : null,
  });

  return (
    <TabsContent
      value="request"
      className="grid size-full grid-rows-[auto_1fr] gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('logManagement.detail.requestPayloadJson')}</span>
        <div className="flex items-center gap-1.5">
          <CopyButton onClick={() => handleCopy(curl)} label={t('logManagement.detail.copyCurl')} />
          {hasBody && <CopyButton onClick={() => handleCopy(body)} label={t('logManagement.detail.copyJson')} />}
        </div>
      </div>
      <pre className="
        scroll-y size-full overflow-x-auto rounded-lg border bg-muted/60
        font-mono text-xs text-foreground
      "
      >
        {hasBody ? body : <span className="text-muted-foreground italic">{t('logManagement.detail.noPayload')}</span>}
      </pre>
    </TabsContent>
  );
}

type CopyButtonProps = { label: string, onClick: () => void };

function CopyButton({ label, onClick }: CopyButtonProps) {
  return (
    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onClick}>
      <Copy className="size-3" />
      {label}
    </Button>
  );
}
