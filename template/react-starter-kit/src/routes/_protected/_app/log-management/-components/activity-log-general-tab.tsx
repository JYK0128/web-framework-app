import { Clock, Copy, Globe, User } from 'lucide-react';
import { toast } from 'sonner';

import type { ActivityLogItemDto } from '#/.generated/api/model';
import { TabsContent } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

interface ActivityLogGeneralTabProps {
  log: ActivityLogItemDto
}

export function ActivityLogGeneralTab({ log }: ActivityLogGeneralTabProps) {
  const { language, t } = useI18n();

  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content);
    toast.success(t('activityLogs.detail.copied'));
  };

  return (
    <TabsContent
      value="general"
      className="scroll-y size-full"
    >
      <div className="grid grid-cols-1 gap-4">
        <InfoCard icon={<Clock className="size-3.5" />} label={t('activityLogs.columns.timestamp')}>
          {new Intl.DateTimeFormat(language, {
            dateStyle: 'medium',
            timeStyle: 'medium',
          }).format(new Date(log.createdAt))}
        </InfoCard>

        <InfoCard icon={<Clock className="size-3.5" />} label={t('activityLogs.columns.duration')}>
          <span className={log.duration > 200
            ? 'text-amber-500'
            : `text-emerald-500`}
          >
            {log.duration}
            {' '}
            ms
          </span>
        </InfoCard>

        <InfoCard icon={<User className="size-3.5" />} label={t('activityLogs.columns.user')}>
          {log.emailHash
            ? (
              <span className="
                flex items-center gap-1.5 font-mono text-xs
                text-muted-foreground
              "
              >
                <span>
                  {log.emailHash.slice(0, 16)}
                  ...
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(log.emailHash ?? '')}
                  className="
                    rounded-sm
                    hover:bg-muted
                  "
                >
                  <Copy className="size-3" />
                </button>
              </span>
            )
            : <span className="text-muted-foreground italic">{t('activityLogs.detail.anonymous')}</span>}
        </InfoCard>

        <InfoCard icon={<Globe className="size-3.5" />} label={t('activityLogs.columns.ip')} mono>
          {log.ip
            ? <CopyableValue value={log.ip} copyLabel={t('activityLogs.detail.copyIp')} onCopy={handleCopy} />
            : '-'}
        </InfoCard>

        <InfoCard label={t('activityLogs.detail.requestId')}>
          <CopyableValue value={log.requestId} copyLabel={t('activityLogs.detail.copyRequestId')} onCopy={handleCopy} />
        </InfoCard>

        <InfoCard label={t('activityLogs.detail.logId')}>
          <CopyableValue value={log.id} copyLabel={t('activityLogs.detail.copyLogId')} onCopy={handleCopy} />
        </InfoCard>
      </div>

      {log.userAgent && (
        <div className="rounded-lg border bg-card shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">{t('activityLogs.detail.userAgent')}</span>
          <p className="break-all font-mono text-xs text-muted-foreground">{log.userAgent}</p>
        </div>
      )}
    </TabsContent>
  );
}

type CopyableValueProps = { copyLabel: string, onCopy: (content: string) => void, value: string };

function CopyableValue({ copyLabel, onCopy, value }: CopyableValueProps) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs">
      <span className="truncate select-all" title={value}>{value}</span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="
          shrink-0 rounded-sm text-muted-foreground
          hover:bg-muted
        "
        title={copyLabel}
      >
        <Copy className="size-3" />
      </button>
    </span>
  );
}

type InfoCardProps = { children: React.ReactNode, icon?: React.ReactNode, label: string, mono?: boolean };

function InfoCard({ children, icon, label, mono = false }: InfoCardProps) {
  return (
    <div className="rounded-lg border bg-card shadow-xs">
      <span className="
        flex items-center gap-1.5 text-xs font-medium text-muted-foreground
      "
      >
        {icon}
        {label}
      </span>
      <p className={cn('text-sm font-semibold', mono && 'font-mono')}>
        {children}
      </p>
    </div>
  );
}
