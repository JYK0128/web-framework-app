import { differenceInSeconds } from 'date-fns';
import { Clock, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Card, CardContent, Progress } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

export function SessionCard() {
  const { sessionExpiresAt, refetchUser } = useAuth();

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!sessionExpiresAt) return null;
    return Math.max(0, differenceInSeconds(sessionExpiresAt, new Date()));
  });

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, differenceInSeconds(sessionExpiresAt, new Date())));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt]);

  const ttlDetails = useMemo(() => {
    if (secondsLeft === null) return { minutes: '--', seconds: '--', percent: 100, isWarning: false };
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const maxTtl = 1800; // 30 mins
    const percent = Math.min(100, Math.max(0, (secondsLeft / maxTtl) * 100));
    return {
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
      percent,
      isWarning: secondsLeft < 300,
    };
  }, [secondsLeft]);

  const handleRefreshSession = async () => {
    const maxTtlSeconds = 1800;
    const rollingThresholdSeconds = 600;
    const minRemainingSecondsForExtension = maxTtlSeconds - rollingThresholdSeconds; // 1200초 (20분)

    if (secondsLeft !== null && secondsLeft > minRemainingSecondsForExtension) {
      const elapsedSeconds = maxTtlSeconds - secondsLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const remainingSecs = elapsedSeconds % 60;
      toast.warning(
        `최소 10분 이상 활동 경과 후에만 연장 가능합니다. (현재 경과: ${elapsedMinutes}분 ${remainingSecs}초 / 남은 시간 20분 이하 시 가능)`,
      );
      return;
    }

    try {
      await refetchUser();
      toast.success('세션 유효 시간이 30분으로 성공적으로 갱신되었습니다.');
    }
    catch {
      toast.error('세션 갱신 실패');
    }
  };

  return (
    <Card className="p-6">
      <CardContent className="grid gap-5 p-0">
        <div className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="grid flex-1 gap-2">
            <div className="
              flex items-center gap-2 text-xs font-semibold
              text-muted-foreground
            "
            >
              <Clock className="size-4 shrink-0 text-amber-500" />
              <span className="flex-1">현재 세션 남은 시간</span>
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 shrink-0 text-2xs"
              >
                <span className="
                  size-1.5 animate-pulse rounded-full bg-emerald-500 shrink-0
                "
                />
                <span>롤링 자동 연장 켜짐</span>
              </Badge>
            </div>

            <div className="
              flex items-baseline gap-1 font-mono text-2xl font-bold
            "
            >
              <span className="rounded-lg bg-muted px-2.5 py-1">{ttlDetails.minutes}</span>
              <span className="font-sans text-xs text-muted-foreground">분</span>
              <span className="text-muted-foreground">:</span>
              <span className="rounded-lg bg-muted px-2.5 py-1">{ttlDetails.seconds}</span>
              <span className="font-sans text-xs text-muted-foreground">초</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="shrink-0" onClick={() => void handleRefreshSession()}>
            <RefreshCw className="size-3.5" />
            <span>세션 갱신</span>
          </Button>
        </div>

        <div className="grid gap-1.5">
          <Progress value={ttlDetails.percent} className="h-2" />
          <div className="
            flex items-center justify-between text-2xs text-muted-foreground
          "
          >
            <span className="flex-1">30분 세션 (10분 활동 단위 자동 연장)</span>
            <span className="shrink-0">
              {Math.round(ttlDetails.percent)}
              % 남음
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
