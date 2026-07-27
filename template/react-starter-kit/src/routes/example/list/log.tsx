import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle2, Pause, Play, Trash2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { createInitialLogs, generateMockLogEntry, type LogEntry, realtimeLogColumns, subscribeToLogStream } from '#/routes/example/-api/realtime-log-mock';

export const Route = createFileRoute('/example/list/log')({
  component: RealtimeLogPage,
});

function RealtimeLogPage() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [maxCount, setMaxCount] = useState<number>(100);

  const initialLogsRef = useRef<LogEntry[]>(createInitialLogs(20));

  // TanStack Query Cache Subscription
  const { data: logs = initialLogsRef.current } = useQuery({
    queryKey: ['realtime-system-logs'],
    queryFn: () => queryClient.getQueryData<LogEntry[]>(['realtime-system-logs']) ?? initialLogsRef.current,
    initialData: initialLogsRef.current,
    staleTime: Infinity,
  });

  // Authentic WebSocket / SSE Push Stream Subscription -> queryClient.setQueryData
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToLogStream((incomingLog) => {
      queryClient.setQueryData<LogEntry[]>(['realtime-system-logs'], (prev = initialLogsRef.current) => {
        const next = [incomingLog, ...prev];
        return next.slice(0, maxCount);
      });
    });

    return () => unsubscribe();
  }, [isConnected, maxCount, queryClient]);

  const table = useDataGrid({
    cursor: true,
    data: logs,
    columns: realtimeLogColumns,
    defaultColumn: { size: 160 },
    initialState: {},
    getRowId: (row) => row.id,
  });

  const handleInjectError = () => {
    const errorLog = generateMockLogEntry('ERROR');
    queryClient.setQueryData<LogEntry[]>(['realtime-system-logs'], (prev = initialLogsRef.current) => {
      const next = [errorLog, ...prev];
      return next.slice(0, maxCount);
    });
  };

  const handleClearLogs = () => {
    queryClient.setQueryData(['realtime-system-logs'], []);
  };

  const stats = useMemo(() => {
    const total = logs.length;
    const errorCount = logs.filter((l) => l.level === 'ERROR').length;
    const warnCount = logs.filter((l) => l.level === 'WARN').length;
    const infoCount = logs.filter((l) => l.level === 'INFO').length;
    return { total, errorCount, warnCount, infoCount };
  }, [logs]);

  return (
    <main className="
      mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden p-5
      md:p-9
    "
    >
      <Card className="flex min-h-0 flex-1 flex-col shadow-sm">
        <CardHeader className="
          flex flex-col gap-4 border-b pb-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">실시간 시스템 로그 스트림 (SSE/WebSocket)</CardTitle>
              {isConnected
                ? (
                  <Badge
                    variant="secondary"
                    className="
                      gap-1.5 border-emerald-500/30 text-emerald-600
                      bg-emerald-500/10
                      dark:text-emerald-400
                    "
                  >
                    <span className="relative flex size-2">
                      <span className="
                        absolute inline-flex size-full animate-ping rounded-full
                        bg-emerald-400 opacity-75
                      "
                      />
                      <span className="
                        relative inline-flex size-2 rounded-full bg-emerald-500
                      "
                      />
                    </span>
                    STREAM CONNECTED
                  </Badge>
                )
                : (
                  <Badge
                    variant="outline"
                    className="gap-1.5 text-muted-foreground"
                  >
                    DISCONNECTED
                  </Badge>
                )}
            </div>
            <CardDescription className="mt-1">
              백엔드에서 비동기 이벤트 발생 시
              {' '}
              <code className="
                rounded-sm bg-muted px-1.5 py-0.5 text-xs font-semibold
              "
              >
                queryClient.setQueryData
              </code>
              를 호출하여 실시간으로 캐시를 업데이트하는 권장 SSE/WebSocket 스트리밍 패턴입니다.
            </CardDescription>
          </div>

          {/* Controls Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={isConnected ? 'outline' : 'default'}
              size="sm"
              onClick={() => setIsConnected(!isConnected)}
              className="gap-1.5"
            >
              {isConnected
                ? <Pause className="size-4" />
                : (
                  <Play className="size-4" />
                )}
              {isConnected ? '스트림 끊기' : '스트림 연결'}
            </Button>

            <Select
              value={String(maxCount)}
              onValueChange={(val) => val && setMaxCount(Number(val))}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="보관 용량" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50개 보관</SelectItem>
                <SelectItem value="100">100개 보관</SelectItem>
                <SelectItem value="200">200개 보관</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleInjectError}
              className="gap-1.5"
            >
              <AlertTriangle className="size-4" />
              에러 주입
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="size-4" />
              비우기
            </Button>
          </div>
        </CardHeader>

        {/* Stats Summary Row */}
        <div className="
          flex items-center gap-4 border-b bg-muted/30 px-6 py-2.5 text-xs
        "
        >
          <span className="font-semibold text-muted-foreground">로그 통계:</span>
          <span className="
            flex items-center gap-1 font-medium text-slate-700
            dark:text-slate-300
          "
          >
            전체
            {' '}
            {stats.total}
            건
          </span>
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            INFO
            {' '}
            {stats.infoCount}
          </span>
          <span className="flex items-center gap-1 font-medium text-amber-600">
            <AlertTriangle className="size-3.5" />
            WARN
            {' '}
            {stats.warnCount}
          </span>
          <span className="flex items-center gap-1 font-medium text-rose-600">
            <XCircle className="size-3.5" />
            ERROR
            {' '}
            {stats.errorCount}
          </span>
        </div>

        <CardContent className="
          flex min-h-0 flex-1 flex-col overflow-hidden p-0
        "
        >
          <DataGridToolbar table={table} />
          <div className="min-h-0 flex-1">
            <DataGrid table={table} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
