import { useI18n } from '@pkg/shared/web';
import { differenceInSeconds } from 'date-fns';
import { Clock, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { authControllerUserProfile } from '#/.generated/api/endpoints/auth/auth';
import { Badge, Button, Card, CardContent, Progress } from '#/.generated/shadcn/components/ui';

const SESSION_TTL_SECONDS = 30 * 60;
const SESSION_ROLLING_THRESHOLD_SECONDS = 10 * 60;

type SessionCardProps = {
  expiresAt: string | null
};

function parseExpiresAt(expiresAt: string | null): Date | null {
  return expiresAt ? new Date(expiresAt) : null;
}

export function SessionCard({ expiresAt }: SessionCardProps) {
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(() => parseExpiresAt(expiresAt));
  const { t } = useI18n();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const updateNow = () => setNow(Date.now());
    const initialUpdate = setTimeout(updateNow, 0);
    const interval = setInterval(updateNow, 1000);

    return () => {
      clearTimeout(initialUpdate);
      clearInterval(interval);
    };
  }, [sessionExpiresAt]);

  const secondsLeft = useMemo(() => {
    if (!sessionExpiresAt || now === null) return null;
    return Math.max(0, differenceInSeconds(sessionExpiresAt, new Date(now)));
  }, [now, sessionExpiresAt]);

  const ttlDetails = useMemo(() => {
    if (secondsLeft === null) return { minutes: '--', seconds: '--', percent: 100 };
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const percent = Math.min(100, Math.max(0, (secondsLeft / SESSION_TTL_SECONDS) * 100));
    return {
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0'),
      percent,
    };
  }, [secondsLeft]);

  const handleRefreshSession = async () => {
    const minRemainingSecondsForExtension = SESSION_TTL_SECONDS - SESSION_ROLLING_THRESHOLD_SECONDS;

    if (secondsLeft !== null && secondsLeft > minRemainingSecondsForExtension) {
      const elapsedSeconds = SESSION_TTL_SECONDS - secondsLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      const remainingSecs = elapsedSeconds % 60;
      toast.warning(
        t('profile.sessionRefreshWarning', { minutes: elapsedMinutes, seconds: remainingSecs }),
      );
      return;
    }

    try {
      const response = await authControllerUserProfile();
      const refreshedExpiresAt = response?.expiresAt ?? null;
      setSessionExpiresAt(parseExpiresAt(refreshedExpiresAt));
      toast.success(t('profile.sessionRefreshSuccess'));
    }
    catch {
      toast.error(t('profile.sessionRefreshFailed'));
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
              <span className="flex-1">{t('profile.currentSessionTime')}</span>
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 shrink-0 text-2xs"
              >
                <span className="
                  size-1.5 animate-pulse rounded-full bg-emerald-500 shrink-0
                "
                />
                <span>{t('profile.rollingExtensionEnabled')}</span>
              </Badge>
            </div>

            <div className="
              flex items-baseline gap-1 font-mono text-2xl font-bold
            "
            >
              <span className="rounded-lg bg-muted px-2.5 py-1">{ttlDetails.minutes}</span>
              <span className="font-sans text-xs text-muted-foreground">{t('profile.minutes')}</span>
              <span className="text-muted-foreground">:</span>
              <span className="rounded-lg bg-muted px-2.5 py-1">{ttlDetails.seconds}</span>
              <span className="font-sans text-xs text-muted-foreground">{t('profile.seconds')}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="shrink-0" onClick={() => void handleRefreshSession()}>
            <RefreshCw className="size-3.5" />
            <span>{t('profile.refreshSession')}</span>
          </Button>
        </div>

        <div className="grid gap-1.5">
          <Progress value={ttlDetails.percent} className="h-2" />
          <div className="
            flex items-center justify-between text-2xs text-muted-foreground
          "
          >
            <span className="flex-1">{t('profile.sessionDescription')}</span>
            <span className="shrink-0">
              {t('profile.remainingPercent', { percent: Math.round(ttlDetails.percent) })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
