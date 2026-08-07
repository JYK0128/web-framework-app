import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, Cpu, HardDrive, Pause, Play, Radio, RotateCcw, Server, Sliders, TrendingUp, Wifi, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart as RechartsAreaChart, Bar, CartesianGrid, ComposedChart as RechartsComposedChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/.generated/shadcn/components/ui';
import { createGeneratorState, createInitialPoints, fetchNextTelemetryStream, type GeneratorState, type TelemetryStreamData } from '#/routes/example/-api/realtime-graph-mock';

export const Route = createFileRoute('/example/graph/')({
  component: RealtimeGraphPage,
});

function RealtimeGraphPage() {
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [intervalMs, setIntervalMs] = useState<number>(1000);
  const [maxPoints, setMaxPoints] = useState<number>(30);
  const [smoothCurve, setSmoothCurve] = useState<boolean>(true);

  // Keep generator and initial data stable without reading refs during render.
  const [generatorState, setGeneratorState] = useState<GeneratorState>(() => createGeneratorState());
  const [initialData] = useState<TelemetryStreamData>(() => ({
    points: createInitialPoints(),
    logs: [],
  }));

  // TanStack Query Polling for real-time telemetry stream
  const { data: streamData = initialData } = useQuery({
    queryKey: ['realtime-telemetry-stream', intervalMs],
    queryFn: () => {
      const prevData = queryClient.getQueryData<TelemetryStreamData>(['realtime-telemetry-stream', intervalMs]) ?? initialData;
      return fetchNextTelemetryStream(prevData, generatorState, maxPoints);
    },
    refetchInterval: isPlaying ? intervalMs : false,
    refetchIntervalInBackground: true,
  });

  const data = streamData.points;
  const logs = streamData.logs;

  // Manual Trigger: Inject Spike
  const handleInjectSpike = () => {
    const currentStream = queryClient.getQueryData<TelemetryStreamData>(['realtime-telemetry-stream', intervalMs]) ?? initialData;
    const updated = fetchNextTelemetryStream(currentStream, generatorState, maxPoints, true);
    queryClient.setQueryData(['realtime-telemetry-stream', intervalMs], updated);
  };

  // Clear data stream
  const handleResetData = () => {
    setGeneratorState(createGeneratorState());
    const resetData: TelemetryStreamData = {
      points: [createInitialPoints()[0]],
      logs: [{ id: String(Date.now()), time: new Date().toTimeString().split(' ')[0], msg: '🔄 스트림 데이터 초기화 완료', type: 'info' }],
    };
    queryClient.setQueryData(['realtime-telemetry-stream', intervalMs], resetData);
  };

  // Latest point & aggregations
  const latest = data[data.length - 1] || {
    cpu: 0,
    memory: 0,
    networkIn: 0,
    networkOut: 0,
    rps: 0,
    errorRate: 0,
    latency: 0,
  };

  const avgCpu = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((acc, p) => acc + p.cpu, 0) / data.length);
  }, [data]);

  const maxCpu = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map((p) => p.cpu));
  }, [data]);

  const avgLatency = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((acc, p) => acc + p.latency, 0) / data.length);
  }, [data]);

  // Status Distribution for Pie Chart
  const statusPieData = useMemo(() => {
    const normalCount = data.filter((d) => d.status === 'normal').length;
    const warningCount = data.filter((d) => d.status === 'warning').length;
    const spikeCount = data.filter((d) => d.status === 'spike').length;
    return [
      { name: '정상 (Normal)', value: normalCount, fill: '#10b981', color: '#10b981' },
      { name: '주의 (Warning)', value: warningCount, fill: '#f59e0b', color: '#f59e0b' },
      { name: '임계 (Spike)', value: spikeCount, fill: '#ef4444', color: '#ef4444' },
    ];
  }, [data]);

  return (
    <div
      className="
        mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4
        md:p-8
      "
    >
      {/* Header */}
      <div
        className="
          flex flex-col justify-between gap-4 border-b pb-5
          md:flex-row md:items-center
        "
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              {isPlaying && (
                <span
                  className="
                    absolute inline-flex size-full animate-ping rounded-full
                    bg-emerald-400 opacity-75
                  "
                />
              )}
              <span
                className={`
                  relative inline-flex size-3 rounded-full
                  ${isPlaying ? 'bg-emerald-500' : 'bg-amber-500'}
                `}
              />
            </span>
            <h1
              className="
                text-2xl font-bold tracking-tight
                md:text-3xl
              "
            >
              실시간 스트리밍 그래프 Dashboard
            </h1>
            <Badge
              variant={isPlaying ? 'default' : 'secondary'}
              className="ml-2 gap-1"
            >
              <Radio
                className={`
                  size-3
                  ${isPlaying ? 'animate-pulse text-emerald-300' : ''}
                `}
              />
              {isPlaying ? 'LIVE STREAMING' : 'PAUSED'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            동적 데이터 스트림, 실시간 차트 렌더링 및 모니터링 메트릭 제어 예시
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isPlaying ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-1.5 font-medium"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            {isPlaying ? '일시 정지' : '실시간 시작'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleInjectSpike}
            className="gap-1.5 shadow-sm"
          >
            <Zap className="size-4 fill-current" />
            부하 스파이크 주입
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetData}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-4" />
            초기화
          </Button>
        </div>
      </div>

      {/* Control Panel Bar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent
          className="
            flex flex-wrap items-center justify-between gap-4 p-4 text-sm
          "
        >
          <div className="flex flex-wrap items-center gap-6">
            {/* Interval Slider */}
            <div className="flex items-center gap-3">
              <Clock className="size-4 text-muted-foreground" />
              <span className="font-medium">갱신 주기:</span>
              <span className="w-12 text-xs font-semibold text-primary">
                {intervalMs}
                ms
              </span>
              <div className="w-28">
                <Slider
                  value={[intervalMs]}
                  min={200}
                  max={3000}
                  step={100}
                  onValueChange={(val: number | readonly number[]) => {
                    const num = typeof val === 'number' ? val : val[0];
                    if (typeof num === 'number') {
                      setIntervalMs(num);
                    }
                  }}
                />
              </div>
            </div>

            {/* Window Size Select */}
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-muted-foreground" />
              <span className="font-medium">표시 개수:</span>
              <Select
                value={String(maxPoints)}
                onValueChange={(v: string | null) => {
                  if (v) {
                    const num = parseInt(v, 10);
                    if (!Number.isNaN(num)) {
                      setMaxPoints(num);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 w-24">
                  <SelectValue placeholder="30개" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 포인트</SelectItem>
                  <SelectItem value="30">30 포인트</SelectItem>
                  <SelectItem value="50">50 포인트</SelectItem>
                  <SelectItem value="100">100 포인트</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Smooth curve switch */}
            <div className="flex items-center gap-2">
              <Switch id="smooth-curve" checked={smoothCurve} onCheckedChange={setSmoothCurve} />
              <label
                htmlFor="smooth-curve"
                className="cursor-pointer text-xs font-medium"
              >
                곡선 보정 (Smooth)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="size-3.5 text-emerald-500" />
            <span>
              수신된 포인트:
              <strong className="text-foreground">{data.length}</strong>
              개
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {/* CPU Utilization */}
        <Card
          className="
            relative overflow-hidden transition-all
            hover:border-primary/50
          "
        >
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
          >
            <CardTitle
              className="
                text-xs font-semibold uppercase tracking-wider
                text-muted-foreground
              "
            >
              CPU 점유율
            </CardTitle>
            <Cpu className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {latest.cpu}
                %
              </div>
              <Badge
                variant={getCpuBadgeVariant(latest.cpu)}
                className="text-[10px]"
              >
                평균
                {' '}
                {avgCpu}
                % / 최고
                {' '}
                {maxCpu}
                %
              </Badge>
            </div>
            <Progress value={latest.cpu} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card
          className="
            relative overflow-hidden transition-all
            hover:border-primary/50
          "
        >
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
          >
            <CardTitle
              className="
                text-xs font-semibold uppercase tracking-wider
                text-muted-foreground
              "
            >
              메모리 (RAM)
            </CardTitle>
            <HardDrive className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {latest.memory}
                %
              </div>
              <span className="text-xs text-muted-foreground">
                {(latest.memory * 0.32).toFixed(1)}
                {' '}
                GB / 32 GB
              </span>
            </div>
            <Progress
              value={latest.memory}
              className="
                mt-3 h-1.5 bg-purple-100
                dark:bg-purple-950/40
              "
            />
          </CardContent>
        </Card>

        {/* Throughput RPS */}
        <Card
          className="
            relative overflow-hidden transition-all
            hover:border-primary/50
          "
        >
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
          >
            <CardTitle
              className="
                text-xs font-semibold uppercase tracking-wider
                text-muted-foreground
              "
            >
              처리량 (RPS)
            </CardTitle>
            <Server className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {latest.rps.toLocaleString()}
                {' '}
                <span className="text-xs font-normal text-muted-foreground">req/s</span>
              </div>
              <div
                className="
                  flex items-center text-xs text-emerald-600 font-medium
                  dark:text-emerald-400
                "
              >
                <ArrowUpRight className="size-3.5" />
                <span>정상가동</span>
              </div>
            </div>
            <div
              className="
                mt-3 flex items-center justify-between text-xs
                text-muted-foreground
              "
            >
              <span>
                에러율:
                <strong
                  className={latest.errorRate > 2
                    ? 'text-destructive font-semibold'
                    : ''}
                >
                  {latest.errorRate}
                  %
                </strong>
              </span>
              <span>
                지연시간:
                <strong>
                  {latest.latency}
                  ms
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Network Traffic */}
        <Card
          className="
            relative overflow-hidden transition-all
            hover:border-primary/50
          "
        >
          <CardHeader
            className="flex flex-row items-center justify-between pb-2"
          >
            <CardTitle
              className="
                text-xs font-semibold uppercase tracking-wider
                text-muted-foreground
              "
            >
              네트워크 트래픽
            </CardTitle>
            <Wifi className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {(latest.networkIn + latest.networkOut).toFixed(2)}
                {' '}
                <span className="text-xs font-normal text-muted-foreground">MB/s</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                평균 지연
                {' '}
                {avgLatency}
                ms
              </Badge>
            </div>
            <div
              className="
                mt-3 flex items-center justify-between text-xs
                text-muted-foreground
              "
            >
              <span className="flex items-center gap-1 text-blue-500">
                <ArrowDownRight className="size-3" />
                {' '}
                In:
                {latest.networkIn}
                {' '}
                MB/s
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <ArrowUpRight className="size-3" />
                {' '}
                Out:
                {latest.networkOut}
                {' '}
                MB/s
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div
        className="
          grid grid-cols-1 gap-6
          lg:grid-cols-3
        "
      >
        {/* Main Dynamic Area Chart - 2 Cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">실시간 시스템 자원 사용률 (CPU & RAM)</CardTitle>
              <CardDescription>초단위 데이터 수신에 맞춰 부드럽게 갱신되는 영역 차트</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 text-xs">
              <TrendingUp className="size-3 text-emerald-500" />
              {' '}
              Live Area Chart
            </Badge>
          </CardHeader>
          <CardContent className="h-80">
            <ClientOnly fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey="cpu"
                    name="CPU (%)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cpuGradient)"
                    isAnimationActive={false}
                  />
                  <Area
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey="memory"
                    name="메모리 (%)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#memGradient)"
                    isAnimationActive={false}
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>

        {/* Side Status Distribution Pie & Metrics */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">스트림 상태 분포</CardTitle>
            <CardDescription>수신된 전체 데이터 포인트의 상태 비율</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            <div className="h-52 w-full">
              <ClientOnly fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    />
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ClientOnly>
            </div>

            {/* Status Legend */}
            <div className="mt-2 space-y-2 text-xs">
              {statusPieData.map((item) => (
                <div
                  key={item.name}
                  className="
                    flex items-center justify-between border-b border-border/40
                    pb-1.5
                  "
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold">
                    {item.value}
                    건 (
                    {data.length ? Math.round((item.value / data.length) * 100) : 0}
                    %)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts: Network Traffic Line Chart + RPS/Error Rate Composed Chart */}
      <div
        className="
          grid grid-cols-1 gap-6
          lg:grid-cols-2
        "
      >
        {/* Network In/Out Line Chart */}
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between pb-3"
          >
            <div>
              <CardTitle className="text-base font-semibold">네트워크 I/O 트래픽 (MB/s)</CardTitle>
              <CardDescription>인바운드 및 아웃바운드 대역폭 흐름</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              In / Out Multi-Line
            </Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ClientOnly fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey="networkIn"
                    name="Inbound (MB/s)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type={smoothCurve ? 'monotone' : 'linear'}
                    dataKey="networkOut"
                    name="Outbound (MB/s)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>

        {/* RPS Bar & Error Rate Line Composed Chart */}
        <Card>
          <CardHeader
            className="flex flex-row items-center justify-between pb-3"
          >
            <div>
              <CardTitle className="text-base font-semibold">초당 요청수(RPS) 및 에러율 (%)</CardTitle>
              <CardDescription>처리량(막대)과 에러 비율(선) 복합 그래프</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              Composed Chart
            </Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ClientOnly fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="rps" name="RPS" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.8} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="errorRate" name="Error Rate (%)" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </RechartsComposedChart>
              </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>
      </div>

      {/* Live Event Activity Log Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">실시간 이벤트 피드 & 알림 로그</CardTitle>
            <CardDescription>부하 스파이크 및 경고 발생 내역 타임라인</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {logs.length}
            {' '}
            개 로그
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto rounded-md border text-xs">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-24">시각</TableHead>
                  <TableHead className="w-24">유형</TableHead>
                  <TableHead>내용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0
                  ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-16 text-center text-muted-foreground"
                      >
                        이벤트 로그가 없습니다. (부하 스파이크를 주입하거나 경고 발생 시 기록됩니다)
                      </TableCell>
                    </TableRow>
                  )
                  : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-muted-foreground">{log.time}</TableCell>
                        <TableCell>
                          {renderLogBadge(log.type)}
                        </TableCell>
                        <TableCell className="font-medium">{log.msg}</TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      className="
        flex size-full items-center justify-center rounded-lg border
        border-dashed p-4
      "
    >
      <div
        className="
          flex items-center gap-2 text-sm text-muted-foreground animate-pulse
        "
      >
        <Activity className="size-4" />
        <span>실시간 차트 로딩 중...</span>
      </div>
    </div>
  );
}

function getCpuBadgeVariant(cpu: number): 'destructive' | 'outline' | 'secondary' {
  if (cpu > 80) return 'destructive';
  if (cpu > 60) return 'outline';
  return 'secondary';
}

function renderLogBadge(type: 'info' | 'warn' | 'spike') {
  if (type === 'spike') {
    return (
      <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
        SPIKE
      </Badge>
    );
  }
  if (type === 'warn') {
    return (
      <Badge
        variant="outline"
        className="border-amber-500 px-1.5 py-0 text-[10px] text-amber-500"
      >
        WARN
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
      INFO
    </Badge>
  );
}
