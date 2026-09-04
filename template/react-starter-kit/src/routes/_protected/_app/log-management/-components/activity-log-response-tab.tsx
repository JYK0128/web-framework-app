import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import type { ActivityLogItemDto } from '#/.generated/api/model';
import { Button, TabsContent } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

interface ActivityLogResponseTabProps {
  log: ActivityLogItemDto
}

export function ActivityLogResponseTab({ log }: ActivityLogResponseTabProps) {
  const { t } = useI18n();
  const hasBody = Boolean(log.responseBody && Object.keys(log.responseBody).length > 0);
  const body = log.responseBody ? JSON.stringify(log.responseBody, null, 2) : '';

  const handleCopy = () => {
    void navigator.clipboard.writeText(body);
    toast.success(t('logManagement.detail.copied'));
  };

  return (
    <TabsContent
      value="response"
      className="grid size-full grid-rows-[auto_1fr] gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('logManagement.detail.responsePayloadJson')}</span>
        {hasBody && (
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy}>
            <Copy className="size-3" />
            {t('logManagement.detail.copyJson')}
          </Button>
        )}
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
