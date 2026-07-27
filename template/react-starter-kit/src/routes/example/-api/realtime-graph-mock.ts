export type MetricPoint = {
  id: string
  time: string
  timestamp: number
  cpu: number
  memory: number
  networkIn: number
  networkOut: number
  rps: number
  errorRate: number
  latency: number
  status: 'normal' | 'warning' | 'spike'
};

export type LogItem = {
  id: string
  time: string
  msg: string
  type: 'info' | 'warn' | 'spike'
};

export type GeneratorState = {
  tick: number
  baseCpu: number
  baseMem: number
  baseRps: number
};

export type TelemetryStreamData = {
  points: MetricPoint[]
  logs: LogItem[]
};

export function getRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export function createInitialPoints(): MetricPoint[] {
  const points: MetricPoint[] = [];
  const now = Date.now();
  let baseMem = 60;
  for (let i = 0; i < 20; i++) {
    const t = i + 1;
    const time = new Date(now - (20 - i) * 1000);
    const timeStr = `${time.toTimeString().split(' ')[0]}.${String(time.getMilliseconds()).padStart(3, '0').slice(0, 2)}`;
    const noise = (getRandom() - 0.5) * 10;
    const cpu = Math.min(99, Math.max(10, Math.round(42 + Math.sin(t / 4) * 15 + noise)));
    const rps = Math.max(100, Math.round(1200 + Math.cos(t / 3) * 300 + (getRandom() - 0.5) * 200));
    const randDelta = getRandom();
    baseMem = Math.min(98, Math.max(30, Math.round(baseMem + (t % 20 === 0 ? (randDelta - 0.4) * 5 : 0.2))));
    const randIn = getRandom();
    const networkIn = parseFloat((Math.max(0.5, 2.5 + Math.sin(t / 2) * 1.5 + (randIn - 0.5) * 0.8)).toFixed(2));
    const randOut = getRandom();
    const networkOut = parseFloat((Math.max(1.0, 5.0 + Math.cos(t / 2) * 2.2 + (randOut - 0.5) * 1.2)).toFixed(2));
    const randLat = getRandom();
    const latency = Math.max(8, Math.round(25 + Math.sin(t / 5) * 12 + (randLat - 0.5) * 10));
    const randErr1 = getRandom();
    const randErr2 = getRandom();
    const errorRate = parseFloat((Math.max(0, 0.2 + (randErr1 > 0.85 ? randErr2 * 2.5 : 0))).toFixed(2));

    points.push({
      id: `${time.getTime()}-${t}`,
      time: timeStr,
      timestamp: time.getTime(),
      cpu,
      memory: baseMem,
      networkIn,
      networkOut,
      rps,
      errorRate,
      latency,
      status: cpu > 75 || errorRate > 2.0 ? 'warning' : 'normal',
    });
  }
  return points;
}

export function createGeneratorState(): GeneratorState {
  return {
    tick: 20,
    baseCpu: 42,
    baseMem: 60,
    baseRps: 1200,
  };
}

export function generateNextPoint(state: GeneratorState, isSpike = false): MetricPoint {
  state.tick += 1;
  const now = new Date();
  const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0').slice(0, 2)}`;

  const t = state.tick;
  const sineFactor = Math.sin(t / 4) * 15;
  const noise = (getRandom() - 0.5) * 10;

  let cpu = Math.min(99, Math.max(10, Math.round(state.baseCpu + sineFactor + noise)));
  let rps = Math.max(100, Math.round(state.baseRps + Math.cos(t / 3) * 300 + (getRandom() - 0.5) * 200));
  const randMem = getRandom();
  const memory = Math.min(98, Math.max(30, Math.round(state.baseMem + (t % 20 === 0 ? (randMem - 0.4) * 5 : 0.2))));
  state.baseMem = memory;

  const randIn = getRandom();
  const networkIn = parseFloat((Math.max(0.5, 2.5 + Math.sin(t / 2) * 1.5 + (randIn - 0.5) * 0.8)).toFixed(2));
  const randOut = getRandom();
  const networkOut = parseFloat((Math.max(1.0, 5.0 + Math.cos(t / 2) * 2.2 + (randOut - 0.5) * 1.2)).toFixed(2));
  const randLat = getRandom();
  let latency = Math.max(8, Math.round(25 + Math.sin(t / 5) * 12 + (randLat - 0.5) * 10));
  const randErr1 = getRandom();
  const randErr2 = getRandom();
  let errorRate = parseFloat((Math.max(0, 0.2 + (randErr1 > 0.85 ? randErr2 * 2.5 : 0))).toFixed(2));

  let status: MetricPoint['status'] = 'normal';

  if (isSpike) {
    cpu = Math.min(99, cpu + 35);
    rps = Math.round(rps * 2.2);
    latency = Math.round(latency * 3.5);
    errorRate = parseFloat((errorRate + 4.5).toFixed(2));
    status = 'spike';
  }
  else if (cpu > 75 || errorRate > 2.0) {
    status = 'warning';
  }

  return {
    id: `${now.getTime()}-${t}`,
    time: timeStr,
    timestamp: now.getTime(),
    cpu,
    memory,
    networkIn,
    networkOut,
    rps,
    errorRate,
    latency,
    status,
  };
}

/** Pure stream update helper for TanStack Query polling */
export function fetchNextTelemetryStream(
  currentData: TelemetryStreamData,
  state: GeneratorState,
  maxPoints: number,
  isSpike = false,
): TelemetryStreamData {
  const newPoint = generateNextPoint(state, isSpike);
  const nextPoints = [...currentData.points, newPoint];
  const points = nextPoints.length > maxPoints ? nextPoints.slice(nextPoints.length - maxPoints) : nextPoints;

  const newLogs = [...currentData.logs];
  if (newPoint.status === 'spike') {
    newLogs.unshift({
      id: newPoint.id,
      time: newPoint.time,
      msg: `🚨 부하 서지 발생! CPU: ${newPoint.cpu}%, RPS: ${newPoint.rps}`,
      type: 'spike',
    });
  }
  else if (newPoint.status === 'warning') {
    newLogs.unshift({
      id: newPoint.id,
      time: newPoint.time,
      msg: `⚠️ 자원 경고 수준 도달! CPU: ${newPoint.cpu}%`,
      type: 'warn',
    });
  }

  return {
    points,
    logs: newLogs.slice(0, 50),
  };
}
