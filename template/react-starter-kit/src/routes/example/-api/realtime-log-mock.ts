import { type ColumnDef } from '@tanstack/react-table';

import { getDataGridToolColumn } from '#/components/data-grid/data-grid-tool-column';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type LogEntry = {
  id: string
  timestamp: string
  level: LogLevel
  service: string
  message: string
  durationMs: number
  ip: string
};

const SERVICES = ['auth-service', 'payment-bff', 'user-db', 'api-gateway', 'worker-node', 'telemetry-collector'];

const MESSAGES: Record<LogLevel, string[]> = {
  INFO: [
    'POST /api/v1/auth/verify 200 OK',
    'Cache hit for user_session_key:9041',
    'gRPC channel connected to billing-service:50051',
    'HTTP GET /api/v1/dashboard/metrics 200',
    'Scheduled background cleanup finished successfully',
    'OAuth2 token refreshed for client_id:app-web',
  ],
  WARN: [
    'Database connection pool usage above 80%',
    'High latency detected on Redis cluster node 2',
    'Rate limit warning threshold reached for client',
    'Slow query detected: SELECT * FROM orders WHERE status = pending',
    'Memory usage peak: 84.2% on pod worker-node-7',
  ],
  ERROR: [
    '500 Internal Server Error - Failed to connect to payment provider',
    'Unhandled promise rejection in worker-queue listener',
    'Connection refused to db-replica-02:5432',
    'JWT validation failed: TokenExpiredError',
    'Circuit breaker OPEN for service payment-bff',
  ],
  DEBUG: [
    'Dispatching event telemetry.metric.collected to Kafka',
    'Executing query: SELECT count(*) FROM active_sessions',
    'Handshake completed with client websocket_id:ws-88392',
    'TLS handshake latency: 12ms',
  ],
};

function getRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

function getRandomIp(): string {
  const octets = [10, Math.floor(getRandom() * 255), Math.floor(getRandom() * 255), Math.floor(getRandom() * 254) + 1];
  return octets.join('.');
}

function getLogLevel(rand: number): LogLevel {
  if (rand > 0.88) return 'ERROR';
  if (rand > 0.70) return 'WARN';
  if (rand > 0.35) return 'INFO';
  return 'DEBUG';
}

export function generateMockLogEntry(forceLevel?: LogLevel): LogEntry {
  const rand = getRandom();
  const level: LogLevel = forceLevel ?? getLogLevel(rand);

  const service = SERVICES[Math.floor(getRandom() * SERVICES.length)];
  const messages = MESSAGES[level];
  const message = messages[Math.floor(getRandom() * messages.length)];
  const durationMs = Math.round((getRandom() * 120 + 2) * 10) / 10;
  const ip = getRandomIp();

  const now = new Date();
  const timestamp = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  return {
    id: `${now.getTime()}-${Math.floor(getRandom() * 10000)}`,
    timestamp,
    level,
    service,
    message,
    durationMs,
    ip,
  };
}

export function createInitialLogs(count = 25): LogEntry[] {
  const logs: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateMockLogEntry());
  }
  return logs;
}

/**
 * Simulates an authentic WebSocket / SSE (Server-Sent Events) push stream.
 * Pushes live events asynchronously with realistic variable arrival delays (300ms ~ 1200ms).
 */
export function subscribeToLogStream(
  onLog: (log: LogEntry) => void,
): () => void {
  let isClosed = false;

  const scheduleNext = () => {
    if (isClosed) return;

    const variableDelay = Math.floor(getRandom() * 900) + 300;
    setTimeout(() => {
      if (isClosed) return;
      onLog(generateMockLogEntry());
      scheduleNext();
    }, variableDelay);
  };

  scheduleNext();

  return () => {
    isClosed = true;
  };
}

export const realtimeLogColumns: ColumnDef<LogEntry>[] = [
  getDataGridToolColumn(),
  {
    accessorKey: 'timestamp',
    header: '시각 (Timestamp)',
    size: 140,
  },
  {
    accessorKey: 'level',
    header: '로그 레벨',
    size: 110,
    meta: {
      filterType: 'faceted',
      filterOptions: [
        { label: 'INFO', value: 'INFO' },
        { label: 'WARN', value: 'WARN' },
        { label: 'ERROR', value: 'ERROR' },
        { label: 'DEBUG', value: 'DEBUG' },
      ],
    },
  },
  {
    accessorKey: 'service',
    header: '서비스',
    size: 150,
  },
  {
    accessorKey: 'message',
    header: '로그 메시지',
    size: 380,
  },
  {
    accessorKey: 'durationMs',
    header: '소요 시간 (ms)',
    size: 120,
  },
  {
    accessorKey: 'ip',
    header: 'IP 주소',
    size: 130,
  },
];
