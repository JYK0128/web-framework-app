import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import type { LogItemDto } from '#/.generated/api/model';
import { Button, TabsContent } from '#/.generated/shadcn/components/ui';
import { ActionCard, SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

interface LogGeneralTabProps {
  log: LogItemDto
}

export function LogGeneralTab({ log }: LogGeneralTabProps) {
  const { language, t } = useI18n();

  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content);
    toast.success(t('logManagement.detail.copied'));
  };

  return (
    <TabsContent
      value="general"
      className="scroll-y size-full"
    >
      <div className="grid grid-cols-1 gap-2.5">
        <ActionCard
          icon="clock"
          title={t('logManagement.columns.timestamp')}
          description={new Intl.DateTimeFormat(language, {
            dateStyle: 'medium',
            timeStyle: 'medium',
          }).format(new Date(log.createdAt))}
        >
          <ActionCard.Actions>
            <span
              className={`
                font-mono text-xs font-semibold
                ${
    log.duration > 200 ? 'text-amber-500' : 'text-emerald-500'
    }
              `}
            >
              {log.duration}
              {' '}
              ms
            </span>
          </ActionCard.Actions>
        </ActionCard>

        <ActionCard
          icon="user-round"
          title={t('logManagement.columns.user')}
          description={
            log.emailHash
              ? `${log.emailHash.slice(0, 24)}...`
              : t('logManagement.detail.anonymous')
          }
        >
          <ActionCard.Actions>
            {log.emailHash && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleCopy(log.emailHash ?? '')}
                title={t('logManagement.detail.copied')}
              >
                <Copy className="size-3.5" />
              </Button>
            )}
          </ActionCard.Actions>
        </ActionCard>

        <ActionCard
          icon="globe"
          title={t('logManagement.columns.ip')}
          description={log.ip || '-'}
        >
          <ActionCard.Actions>
            {log.ip && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleCopy(log.ip ?? '')}
                title={t('logManagement.detail.copyIp')}
              >
                <Copy className="size-3.5" />
              </Button>
            )}
          </ActionCard.Actions>
        </ActionCard>

        <ActionCard
          icon="server"
          title={t('logManagement.detail.requestId')}
          description={log.requestId}
        >
          <ActionCard.Actions>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => handleCopy(log.requestId)}
              title={t('logManagement.detail.copyRequestId')}
            >
              <Copy className="size-3.5" />
            </Button>
          </ActionCard.Actions>
        </ActionCard>

        <ActionCard
          icon="file-text"
          title={t('logManagement.detail.logId')}
          description={log.id}
        >
          <ActionCard.Actions>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => handleCopy(log.id)}
              title={t('logManagement.detail.copyLogId')}
            >
              <Copy className="size-3.5" />
            </Button>
          </ActionCard.Actions>
        </ActionCard>

        {log.userAgent && (
          <SectionCard
            icon="activity"
            textSize="xs"
            title={t('logManagement.detail.userAgent')}
          >
            <SectionCard.Content>
              <p className="break-all font-mono text-xs text-muted-foreground">{log.userAgent}</p>
            </SectionCard.Content>
          </SectionCard>
        )}
      </div>
    </TabsContent>
  );
}
