import { createLogger } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { LocaleSwitcher } from '#/components/locale-switcher';
import { alert, confirm } from '#/components/system-dialog';

const logger = createLogger('ReactStarterKit');

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [count, setCount] = useState(0);
  const { language, t } = useI18n();

  useEffect(() => {
    logger.info(`App mounted with language: ${language}`);
  }, [language]);

  const handleToastDemo = () => {
    toast.success('토스트 메시지 작동 성공!', {
      description: 'Sonner Toaster가 정상적으로 연동되었습니다.',
    });
  };

  const handleAlertDialogDemo = async () => {
    await alert({
      title: '시스템 알림',
      description: 'SystemDialog 커스텀 얼럿창이 성공적으로 실행되었습니다.',
      tone: 'info',
    });
  };

  const handleConfirmDialogDemo = async () => {
    const ok = await confirm({
      title: '확인 요청',
      description: '이 작업을 계속 진행하시겠습니까?',
      tone: 'warning',
    });
    if (ok) {
      toast.success('확인 버튼을 클릭하셨습니다.');
    }
    else {
      toast.info('취소하셨습니다.');
    }
  };

  const handleMultipleDialogsDemo = async () => {
    const ok = await confirm({
      title: '1차 확인 (연속 다이얼로그 테스트)',
      description: '첫 번째 다이얼로그입니다. 확인을 누르면 다음 다이얼로그가 연속으로 실행됩니다.',
      tone: 'warning',
    });

    if (ok) {
      await alert({
        title: '2차 알림 (연속 다이얼로그 완료)',
        description: '첫 번째 다이얼로그가 닫힌 후 순차적(큐 방식)으로 두 번째 다이얼로그가 정상 실행되었습니다.',
        tone: 'success',
      });
      toast.success('연속 다이얼로그 흐름이 정상적으로 완료되었습니다.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      {/* Header Bar */}
      <header className="
        z-40 flex shrink-0 items-center justify-between border-b
        bg-background/80 px-6 py-4 backdrop-blur-md
      "
      >
        <div className="flex items-center gap-3">
          <div className="
            flex size-9 items-center justify-center rounded-xl bg-primary
            text-primary-foreground shadow-md
          "
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">React Starter Kit</h1>
            <p className="text-xs text-muted-foreground">TanStack Start + Tailwind v4 + Shadcn UI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="
              hidden
              sm:inline-flex
            "
          >
            SSR / Ready
          </Badge>
          <LocaleSwitcher />
        </div>
      </header>

      {/* Main Container */}
      <main className="scroll-y flex-1">
        <div className="
          mx-auto max-w-4xl space-y-8 p-5
          md:p-9
        "
        >
          {/* Hero Section */}
          <div className="
            space-y-3 text-center
            sm:text-left
          "
          >
            <Badge className="
              bg-primary/10 text-primary
              hover:bg-primary/20
            "
            >
              SSR Enabled
            </Badge>
            <h2 className="
              text-3xl font-extrabold tracking-tight
              sm:text-4xl
            "
            >
              {t('page.home.title')}
            </h2>
            <p className="text-muted-foreground">
              Production-grade React Template built with TanStack Start, Tailwind v4, Shadcn UI, and Security Middlewares.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="
            grid gap-6
            md:grid-cols-2
          "
          >
            {/* Interactive Counter Card */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle size={18} className="text-emerald-500" />
                  상태 관리 & 카운터 테스트
                </CardTitle>
                <CardDescription>
                  React 상태 업데이트와 버튼 액션을 테스트합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="
                  flex items-center justify-between rounded-lg bg-muted p-4
                "
                >
                  <span className="text-sm font-medium">현재 카운트</span>
                  <span className="text-2xl font-black text-primary">{count}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" onClick={() => setCount((c) => c + 1)}>
                  카운트 증가
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCount(0)}>
                  초기화
                </Button>
              </CardFooter>
            </Card>

            {/* UI Component Showcase Card */}
            <Card className="shadow-sm border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle size={18} className="text-blue-500" />
                  알림 & 다이얼로그 테스트
                </CardTitle>
                <CardDescription>
                  Toaster 및 SystemDialog 컴포넌트 동작을 검증합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" className="w-full justify-start" onClick={handleToastDemo}>
                  ✨ 토스트 알림 띄우기 (Sonner)
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => void handleAlertDialogDemo()}>
                  💬 시스템 얼럿 다이얼로그 (Alert)
                </Button>
                <Button
                  variant="outline"
                  className="
                    w-full justify-start text-amber-600 border-amber-200
                    hover:bg-amber-50
                    dark:text-amber-400 dark:border-amber-900
                    dark:hover:bg-amber-950
                  "
                  onClick={() => void handleConfirmDialogDemo()}
                >
                  ⚠️ 시스템 확인 다이얼로그 (Confirm)
                </Button>
                <Button
                  variant="outline"
                  className="
                    w-full justify-start text-purple-600 border-purple-200
                    hover:bg-purple-50
                    dark:text-purple-400 dark:border-purple-900
                    dark:hover:bg-purple-950
                  "
                  onClick={() => void handleMultipleDialogsDemo()}
                >
                  🔄 연속/중복 다이얼로그 테스트 (Queued Dialog)
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
