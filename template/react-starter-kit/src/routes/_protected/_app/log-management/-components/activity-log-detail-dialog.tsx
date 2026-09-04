import { Copy, Globe, Info, Server, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { ActivityLogItemDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';
import { activityLogMethodVariants, toActivityLogMethodVariant } from '#/routes/_protected/_app/log-management/-configs/activity-log.config';

import { ActivityLogErrorTab } from './activity-log-error-tab';
import { ActivityLogGeneralTab } from './activity-log-general-tab';
import { ActivityLogRequestTab } from './activity-log-request-tab';
import { ActivityLogResponseTab } from './activity-log-response-tab';

type ActivityLogDetailDialogProps = DialogComponentProps<void> & {
  log: ActivityLogItemDto
};

export function ActivityLogDetailDialog({
  log,
  open,
  onOpenChange,
}: ActivityLogDetailDialogProps) {
  const { t } = useI18n();

  if (!log) return null;

  const isSuccess = log.statusCode >= 200 && log.statusCode < 400;
  const isError = log.statusCode >= 400;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] h-[600px] flex flex-col">
        <DialogHeader className="">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={activityLogMethodVariants({
                  method: toActivityLogMethodVariant(log.method),
                  className: 'shrink-0 rounded-md text-xs uppercase tracking-wider',
                })}
              >
                {log.method}
              </span>
              <span
                className="
                  truncate font-mono text-sm font-semibold text-foreground
                "
                title={log.url}
              >
                {log.url}
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(log.url);
                  toast.success(t('activityLogs.detail.copied'));
                }}
                className="
                  shrink-0 rounded-sm text-muted-foreground transition-colors
                  hover:bg-muted hover:text-foreground
                "
                title={t('activityLogs.detail.copyUrl')}
              >
                <Copy className="size-3" />
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant={isSuccess ? 'outline' : 'destructive'}
                className={`
                  font-mono text-xs
                  ${isSuccess
      ? `
        border-emerald-500/40 text-emerald-600
        dark:text-emerald-400
        bg-emerald-500/10
      `
      : ''}
                `}
              >
                {log.statusCode}
              </Badge>
            </div>
          </div>
          <DialogTitle className="sr-only">{t('activityLogs.detail.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('activityLogs.detail.title')}</DialogDescription>

        </DialogHeader>

        <div className="flex-1">
          <Tabs
            defaultValue="general"
            className="grid size-full grid-rows-[auto_1fr] gap-4"
          >
            <TabsList className="grid h-10 w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1.5 text-xs">
                <Info className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.general')}</span>
              </TabsTrigger>
              <TabsTrigger value="request" className="gap-1.5 text-xs">
                <Server className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.requestPayload')}</span>
              </TabsTrigger>
              <TabsTrigger value="response" className="gap-1.5 text-xs">
                <Globe className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.responsePayload')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="error"
                disabled={!isError}
                className={cn('gap-1.5 text-xs', isError && `text-rose-500`)}
              >
                <XCircle className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.error')}</span>
              </TabsTrigger>
            </TabsList>

            <ActivityLogGeneralTab log={log} />
            <ActivityLogRequestTab log={log} />
            <ActivityLogResponseTab log={log} />
            <ActivityLogErrorTab log={log} />
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
