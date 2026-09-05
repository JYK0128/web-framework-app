import { Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { LogItemDto } from '#/.generated/api/model';
import { Button, TabsContent } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

interface LogErrorTabProps {
  log: LogItemDto
}

export function LogErrorTab({ log }: LogErrorTabProps) {
  const { t } = useI18n();
  const [selectedField, setSelectedField] = useState<'message' | 'details' | 'sql' | 'stack'>('message');
  const error = log.errorInfo;

  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content);
    toast.success(t('logManagement.detail.copied'));
  };

  return (
    <TabsContent
      value="error"
      className="grid size-full grid-rows-[auto_1fr] gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {error?.name && (
            <span className="truncate font-mono text-2xs text-muted-foreground">
              {error.name}
            </span>
          )}
          {error?.code && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="
                truncate font-mono text-2xs text-muted-foreground
              "
              >
                {error.code}
              </span>
            </>
          )}
        </div>
        {error && (
          <CopyButton
            label={t('logManagement.detail.copyJson')}
            onClick={() => handleCopy(JSON.stringify(error, null, 2))}
          />
        )}
      </div>

      {error
        ? (
          <section className="grid h-full grid-cols-1">
            <nav className="flex gap-1 overflow-x-auto border-b">
              {[
                { key: 'message' as const, label: t('logManagement.detail.errorMessage'), value: error.message },
                { key: 'details' as const, label: t('logManagement.detail.validationDetails'), value: error.details },
                { key: 'sql' as const, label: t('logManagement.detail.sqlStatement'), value: error.sql },
                { key: 'stack' as const, label: t('logManagement.detail.stackTrace'), value: error.stack },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    `
                      flex shrink-0 items-center justify-between border-l-2
                      border-transparent text-left text-xs transition-colors
                    `,
                    selectedField === item.key
                      ? 'border-foreground font-semibold text-foreground'
                      : `
                        text-muted-foreground
                        hover:text-foreground
                      `,
                  )}
                  onClick={() => setSelectedField(item.key)}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="text-2xs opacity-60">{item.value ? '있음' : '-'}</span>
                </button>
              ))}
            </nav>

            <DiagnosticBlock
              title={[
                { key: 'message' as const, label: t('logManagement.detail.errorMessage'), content: error.message || t('logManagement.detail.unknownServerError') },
                { key: 'details' as const, label: t('logManagement.detail.validationDetails'), content: formatDiagnosticValue(error.details) },
                { key: 'sql' as const, label: t('logManagement.detail.sqlStatement'), content: formatDiagnosticValue(error.sql) },
                { key: 'stack' as const, label: t('logManagement.detail.stackTrace'), content: formatDiagnosticValue(error.stack) },
              ].find((item) => item.key === selectedField)?.label ?? ''}
              content={[
                { key: 'message' as const, content: error.message || t('logManagement.detail.unknownServerError') },
                { key: 'details' as const, content: formatDiagnosticValue(error.details) },
                { key: 'sql' as const, content: formatDiagnosticValue(error.sql) },
                { key: 'stack' as const, content: formatDiagnosticValue(error.stack) },
              ].find((item) => item.key === selectedField)?.content ?? '-'}
              tone={selectedField === 'message' ? 'error' : 'default'}
              onCopy={() => {
                if (selectedField === 'message') {
                  handleCopy(error.message || t('logManagement.detail.unknownServerError'));
                  return;
                }
                handleCopy(formatDiagnosticValue(error[selectedField]));
              }}
              copyLabel={t('logManagement.copy')}
            />
          </section>
        )
        : <p className="text-sm text-muted-foreground italic">{t('logManagement.detail.noErrorDetail')}</p>}
    </TabsContent>
  );
}

function formatDiagnosticValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'symbol') {
    return value.description ? `Symbol(${value.description})` : 'Symbol';
  }

  try {
    const serialized = JSON.stringify(value, null, 2);
    return serialized ?? Object.prototype.toString.call(value);
  }
  catch {
    return Object.prototype.toString.call(value);
  }
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

type DiagnosticBlockProps = {
  className?: string
  content: string
  copyLabel?: string
  onCopy?: () => void
  title: string
  tone?: 'default' | 'error'
};

function DiagnosticBlock({ className, content, copyLabel, onCopy, title, tone = 'default' }: DiagnosticBlockProps) {
  return (
    <section className={cn(`flex flex-col`, className)}>
      <div className="flex items-center justify-between gap-2 border-b">
        <h3 className="
          text-2xs font-semibold uppercase tracking-wider text-muted-foreground
        "
        >
          {title}
        </h3>
        {onCopy && copyLabel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-2xs text-muted-foreground"
            onClick={onCopy}
          >
            <Copy className="size-2.5" />
            {copyLabel}
          </Button>
        )}
      </div>
      <pre
        className={cn(
          `
            scroll-y flex-1 overflow-x-auto whitespace-pre-wrap font-mono
            text-xs/relaxed
          `,
          tone === 'error' ? 'font-medium' : 'text-foreground',
        )}
      >
        {content}
      </pre>
    </section>
  );
}
