import { useI18n } from '@pkg/shared/web';
import { Check, Clock, Copy, Globe, Info, Server, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export interface ActivityLogItem {
  id: string
  requestId: string
  createdAt: string | Date
  method: string
  url: string
  statusCode: number
  duration: number
  ip?: string | null
  userAgent?: string | null
  level: string
  emailHash?: string | null
  requestBody?: Record<string, unknown> | null
  responseBody?: Record<string, unknown> | null
  errorMessage?: string | null
}

interface ActivityLogDetailDialogProps {
  log: ActivityLogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatJson(data: unknown): string {
  if (data === null || data === undefined) return '';
  try {
    return JSON.stringify(data, null, 2);
  }
  catch {
    return typeof data === 'string' ? data : '';
  }
}

function generateCurl(log: ActivityLogItem): string {
  let curl = `curl -X ${log.method} "${log.url}"`;
  if (log.userAgent) {
    curl += ` \\\n  -H "User-Agent: ${log.userAgent}"`;
  }
  if (log.requestBody && Object.keys(log.requestBody).length > 0) {
    curl += ` \\\n  -H "Content-Type: application/json"`;
    curl += ` \\\n  -d '${JSON.stringify(log.requestBody)}'`;
  }
  return curl;
}

function getMethodBadgeClass(method: string): string {
  switch (method) {
    case 'GET':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    case 'POST':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    default:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  }
}

export function ActivityLogDetailDialog({ log, open, onOpenChange }: ActivityLogDetailDialogProps) {
  const { t, language } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!log) return null;

  const handleCopy = (content: string, tabName: string) => {
    void navigator.clipboard.writeText(content);
    setCopiedTab(tabName);
    toast.success(t('activityLogs.detail.copied'));
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const isSuccess = log.statusCode >= 200 && log.statusCode < 400;
  const isError = log.statusCode >= 400;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        sm:max-w-3xl
        max-h-[90vh] h-[600px] flex flex-col
      "
      >
        <DialogHeader className="pr-8">

          <div className="
            flex flex-wrap items-center justify-between gap-3 pr-6
          "
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`
                shrink-0 rounded-md px-2.5 py-1 text-xs font-mono font-bold
                uppercase tracking-wider
                ${getMethodBadgeClass(log.method)}
              `}
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
                onClick={() => handleCopy(log.url, 'url')}
                className="
                  shrink-0 rounded-sm p-1 text-muted-foreground
                  transition-colors
                  hover:bg-muted hover:text-foreground
                "
                title={t('activityLogs.detail.copyUrl')}
              >
                {copiedTab === 'url'
                  ? (
                    <Check className="size-3 text-emerald-500" />
                  )
                  : (
                    <Copy className="size-3" />
                  )}
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Record Unique ID Chip */}
            <div className="
              inline-flex items-center gap-1.5 rounded-md border
              bg-background/80 px-2 py-0.5 font-mono text-2xs
              text-muted-foreground shadow-2xs backdrop-blur-xs
            "
            >
              <span className="font-semibold text-foreground/70">ID</span>
              <span className="text-muted-foreground/50">:</span>
              <span className="max-w-[160px] truncate select-all" title={log.id}>
                {log.id}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(log.id, 'log-id')}
                className="
                  rounded-sm p-0.5 text-muted-foreground transition-colors
                  hover:bg-muted hover:text-foreground
                "
                title="Copy Log ID"
              >
                {copiedTab === 'log-id'
                  ? (
                    <Check className="size-3 text-emerald-500" />
                  )
                  : (
                    <Copy className="size-3" />
                  )}
              </button>
            </div>

            {/* Request Tracing ID Chip */}
            <div className="
              inline-flex items-center gap-1.5 rounded-md border
              bg-background/80 px-2 py-0.5 font-mono text-2xs
              text-muted-foreground shadow-2xs backdrop-blur-xs
            "
            >
              <span className="font-semibold text-foreground/70">ReqID</span>
              <span className="text-muted-foreground/50">:</span>
              <span className="max-w-[200px] truncate select-all" title={log.requestId}>
                {log.requestId}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(log.requestId, 'req-id')}
                className="
                  rounded-sm p-0.5 text-muted-foreground transition-colors
                  hover:bg-muted hover:text-foreground
                "
                title="Copy Request ID"
              >
                {copiedTab === 'req-id'
                  ? (
                    <Check className="size-3 text-emerald-500" />
                  )
                  : (
                    <Copy className="size-3" />
                  )}
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Tabs
            defaultValue="general"
            className="
              grid size-full grid-rows-[auto_1fr] gap-4 overflow-hidden
            "
          >
            <TabsList className="grid h-10 w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1.5 px-2 text-xs">
                <Info className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.general')}</span>
              </TabsTrigger>
              <TabsTrigger value="request" className="gap-1.5 px-2 text-xs">
                <Server className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.requestPayload')}</span>
              </TabsTrigger>
              <TabsTrigger value="response" className="gap-1.5 px-2 text-xs">
                <Globe className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.responsePayload')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="error"
                disabled={!isError && !log.errorMessage}
                className="gap-1.5 px-2 text-xs text-rose-500"
              >
                <XCircle className="size-3.5 shrink-0" />
                <span className="truncate">{t('activityLogs.detail.error')}</span>
              </TabsTrigger>
            </TabsList>

            <GeneralTabContent log={log} dateLocale={dateLocale} handleCopy={handleCopy} t={t} />
            <RequestTabContent log={log} copiedTab={copiedTab} handleCopy={handleCopy} t={t} />
            <ResponseTabContent log={log} copiedTab={copiedTab} handleCopy={handleCopy} t={t} />
            <ErrorTabContent log={log} copiedTab={copiedTab} handleCopy={handleCopy} t={t} />
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}

function GeneralTabContent({
  log,
  dateLocale,
  handleCopy,
  t,
}: {
  log: ActivityLogItem
  dateLocale: string
  handleCopy: (content: string, name: string) => void
  t: (key: string, ...args: unknown[]) => string
}) {
  return (
    <TabsContent
      value="general"
      className="mt-0 size-full space-y-4 overflow-y-auto pr-1"
    >
      <div className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2
      "
      >
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="
            flex items-center gap-1.5 text-xs font-medium text-muted-foreground
          "
          >
            <Clock className="size-3.5" />
            {t('activityLogs.columns.timestamp')}
          </span>
          <p className="mt-1 text-sm font-semibold">
            {new Date(log.createdAt).toLocaleString(dateLocale, {
              dateStyle: 'medium',
              timeStyle: 'medium',
            })}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="
            flex items-center gap-1.5 text-xs font-medium text-muted-foreground
          "
          >
            <Clock className="size-3.5" />
            {t('activityLogs.columns.duration')}
          </span>
          <p className="mt-1 text-sm font-semibold">
            <span className={log.duration > 200
              ? 'text-amber-500'
              : `text-emerald-500`}
            >
              {log.duration}
              {' '}
              ms
            </span>
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="
            flex items-center gap-1.5 text-xs font-medium text-muted-foreground
          "
          >
            <User className="size-3.5" />
            {t('activityLogs.columns.user')}
          </span>
          <p className="mt-1 text-sm font-semibold">
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
                    onClick={() => handleCopy(log.emailHash || '', 'User Hash')}
                    className="
                      rounded-sm p-0.5
                      hover:bg-muted
                    "
                  >
                    <Copy className="size-3" />
                  </button>
                </span>
              )
              : (
                <span className="text-muted-foreground italic">Anonymous / System</span>
              )}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="
            flex items-center gap-1.5 text-xs font-medium text-muted-foreground
          "
          >
            <Globe className="size-3.5" />
            {t('activityLogs.columns.ip')}
          </span>
          <p className="mt-1 font-mono text-sm font-semibold">
            {log.ip || '-'}
          </p>
        </div>
      </div>

      {log.userAgent && (
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">User Agent</span>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {log.userAgent}
          </p>
        </div>
      )}
    </TabsContent>
  );
}

function RequestTabContent({
  log,
  copiedTab,
  handleCopy,
  t,
}: {
  log: ActivityLogItem
  copiedTab: string | null
  handleCopy: (content: string, name: string) => void
  t: (key: string, ...args: unknown[]) => string
}) {
  return (
    <TabsContent
      value="request"
      className="mt-0 grid size-full grid-rows-[auto_1fr] gap-2 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Request Payload (JSON)</span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => handleCopy(generateCurl(log), 'curl')}
          >
            {copiedTab === 'curl'
              ? <Check className="size-3 text-emerald-500" />
              : (
                <Copy className="size-3" />
              )}
            {t('activityLogs.detail.copyCurl')}
          </Button>
          {log.requestBody && Object.keys(log.requestBody).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => handleCopy(formatJson(log.requestBody), 'req')}
            >
              {copiedTab === 'req'
                ? <Check className="size-3 text-emerald-500" />
                : (
                  <Copy className="size-3" />
                )}
              {t('activityLogs.detail.copyJson')}
            </Button>
          )}
        </div>
      </div>
      <pre className="
        size-full overflow-auto rounded-lg border bg-muted/60 p-4 font-mono
        text-xs text-foreground
      "
      >
        {log.requestBody && Object.keys(log.requestBody).length > 0
          ? formatJson(log.requestBody)
          : <span className="text-muted-foreground italic">{t('activityLogs.detail.noPayload')}</span>}
      </pre>
    </TabsContent>
  );
}

function ResponseTabContent({
  log,
  copiedTab,
  handleCopy,
  t,
}: {
  log: ActivityLogItem
  copiedTab: string | null
  handleCopy: (content: string, name: string) => void
  t: (key: string, ...args: unknown[]) => string
}) {
  return (
    <TabsContent
      value="response"
      className="mt-0 grid size-full grid-rows-[auto_1fr] gap-2 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Response Payload (JSON)</span>
        {log.responseBody && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => handleCopy(formatJson(log.responseBody), 'res')}
          >
            {copiedTab === 'res'
              ? <Check className="size-3 text-emerald-500" />
              : (
                <Copy className="size-3" />
              )}
            {t('activityLogs.detail.copyJson')}
          </Button>
        )}
      </div>
      <pre className="
        size-full overflow-auto rounded-lg border bg-muted/60 p-4 font-mono
        text-xs text-foreground
      "
      >
        {log.responseBody && Object.keys(log.responseBody).length > 0
          ? formatJson(log.responseBody)
          : <span className="text-muted-foreground italic">{t('activityLogs.detail.noPayload')}</span>}
      </pre>
    </TabsContent>
  );
}

function ErrorTabContent({
  log,
  copiedTab,
  handleCopy,
  t,
}: {
  log: ActivityLogItem
  copiedTab: string | null
  handleCopy: (content: string, name: string) => void
  t: (key: string, ...args: unknown[]) => string
}) {
  return (
    <TabsContent
      value="error"
      className="mt-0 grid size-full grid-rows-[auto_1fr] gap-2 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-rose-500">Error Stack & Diagnostics</span>
        {log.errorMessage && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => handleCopy(log.errorMessage || '', 'err')}
          >
            {copiedTab === 'err'
              ? <Check className="size-3 text-emerald-500" />
              : (
                <Copy className="size-3" />
              )}
            {t('activityLogs.detail.copyJson')}
          </Button>
        )}
      </div>
      <pre className="
        size-full overflow-auto rounded-lg border border-rose-500/30
        bg-rose-500/5 p-4 font-mono text-xs text-rose-600
        dark:text-rose-400
      "
      >
        {log.errorMessage || 'Unknown server error'}
      </pre>
    </TabsContent>
  );
}
