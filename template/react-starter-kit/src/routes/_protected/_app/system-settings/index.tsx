import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { Activity, Bell, Loader2, RotateCcw, Save, Send, Settings, Shield, Sliders } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_protected/_app/system-settings/')({
  component: SystemSettingsPageComponent,
});

interface SettingsState {
  siteName: string
  environment: string
  defaultLanguage: string
  timezone: string
  maintenanceMode: boolean
  maintenanceMessage: string
  allowRegistration: boolean

  enforce2FA: boolean
  sessionTimeout: string
  passwordExpiration: string
  maxLoginAttempts: string
  allowConcurrentSessions: boolean

  logRetention: string
  auditLogLevel: string
  streamBufferSize: string
  traceSampling: string

  slackWebhookUrl: string
  discordWebhookUrl: string
  alertEmail: string
  healthCheckInterval: string
}

const DEFAULT_SETTINGS: SettingsState = {
  siteName: 'Antigravity Enterprise Web App',
  environment: 'production',
  defaultLanguage: 'ko',
  timezone: 'Asia/Seoul',
  maintenanceMode: false,
  maintenanceMessage: '정기 시스템 점검 중입니다. 잠시 후 다시 접속해 주세요.',
  allowRegistration: true,

  enforce2FA: true,
  sessionTimeout: '60',
  passwordExpiration: '90',
  maxLoginAttempts: '5',
  allowConcurrentSessions: false,

  logRetention: '30',
  auditLogLevel: 'WARN',
  streamBufferSize: '100',
  traceSampling: '50',

  slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXX',
  discordWebhookUrl: '',
  alertEmail: 'security-admin@company.com',
  healthCheckInterval: '60',
};

const SESSION_TIMEOUT_LABELS: Record<string, string> = {
  15: '15분',
  30: '30분',
  60: '1시간',
  1440: '24시간',
};

const PASSWORD_EXPIRATION_LABELS: Record<string, string> = {
  30: '30일',
  60: '60일',
  90: '90일',
  0: '미적용',
};

function SystemSettingsPageComponent() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const handleChange = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(t('systemSettings.saveSuccess'));
    }, 600);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info(t('systemSettings.resetSuccess'));
  };

  const handleTestWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      toast.success(t('systemSettings.testWebhookSuccess'));
    }, 800);
  };

  return (
    <div className="
      mx-auto grid size-full max-w-6xl grid-rows-[auto_1fr] gap-6
      overflow-y-auto p-6
    "
    >
      {/* Header */}
      <div className="
        flex flex-wrap items-center justify-between gap-4 border-b pb-5
      "
      >
        <div>
          <h1 className="
            flex items-center gap-2.5 text-2xl font-bold tracking-tight
            text-foreground
          "
          >
            <Settings className="size-6 text-primary" />
            {t('systemSettings.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('systemSettings.description')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="size-3.5" />
            {t('systemSettings.reset')}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 text-xs shadow-sm"
          >
            {isSaving
              ? <Loader2 className="size-3.5 animate-spin" />
              : (
                <Save className="size-3.5" />
              )}
            {t('systemSettings.save')}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="grid grid-rows-[auto_1fr] gap-6">
        <TabsList className="
          grid h-11 w-full grid-cols-2
          sm:w-fit sm:grid-cols-4
        "
        >
          <TabsTrigger value="general" className="gap-2 text-xs">
            <Sliders className="size-3.5" />
            {t('systemSettings.tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs">
            <Shield className="size-3.5" />
            {t('systemSettings.tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="logging" className="gap-2 text-xs">
            <Activity className="size-3.5" />
            {t('systemSettings.tabs.logging')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs">
            <Bell className="size-3.5" />
            {t('systemSettings.tabs.notifications')}
          </TabsTrigger>
        </TabsList>

        <GeneralTabPane settings={settings} onChange={handleChange} t={t} />
        <SecurityTabPane settings={settings} onChange={handleChange} t={t} />
        <LoggingTabPane settings={settings} onChange={handleChange} t={t} />
        <NotificationsTabPane
          settings={settings}
          onChange={handleChange}
          onTestWebhook={handleTestWebhook}
          isTestingWebhook={isTestingWebhook}
          t={t}
        />
      </Tabs>
    </div>
  );
}

function GeneralTabPane({
  settings,
  onChange,
  t,
}: {
  settings: SettingsState
  onChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  t: (key: string) => string
}) {
  return (
    <TabsContent value="general" className="mt-0 space-y-6">
      <Card className="border shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">{t('systemSettings.general.title')}</CardTitle>
          <CardDescription className="text-xs">{t('systemSettings.general.description')}</CardDescription>
        </CardHeader>
        <CardContent className="
          grid gap-6 p-6
          sm:grid-cols-2
        "
        >
          <div className="space-y-2">
            <Label htmlFor="siteName" className="text-xs font-semibold">{t('systemSettings.general.siteName')}</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => onChange('siteName', e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.general.environment')}</Label>
            <div className="flex items-center gap-2 pt-1.5">
              <Badge
                variant="outline"
                className="
                  border-emerald-500/40 bg-emerald-500/10 font-mono text-xs
                  text-emerald-600
                  dark:text-emerald-400
                "
              >
                production
              </Badge>
              <span className="text-xs text-muted-foreground">Node.js 22 LTS / Linux x64</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.general.defaultLanguage')}</Label>
            <Select value={settings.defaultLanguage} onValueChange={(val) => onChange('defaultLanguage', val ?? 'ko')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {settings.defaultLanguage === 'ko' ? '한국어 (Korean)' : 'English'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어 (Korean)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.general.timezone')}</Label>
            <Select value={settings.timezone} onValueChange={(val) => onChange('timezone', val ?? 'Asia/Seoul')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {settings.timezone === 'Asia/Seoul' ? 'Asia/Seoul (KST, UTC+9)' : 'UTC (Universal Coordinated Time)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</SelectItem>
                <SelectItem value="UTC">UTC (Universal Coordinated Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">{t('systemSettings.general.maintenanceTitle')}</CardTitle>
          <CardDescription className="text-xs">{t('systemSettings.general.maintenanceDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="
            flex items-center justify-between rounded-lg border p-4
          "
          >
            <div>
              <p className="font-semibold text-foreground text-xs">{t('systemSettings.general.maintenanceTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('systemSettings.general.maintenanceDesc')}</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => onChange('maintenanceMode', checked)}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label
                htmlFor="maintMsg"
                className="text-xs font-semibold text-rose-500"
              >
                {t('systemSettings.general.maintenanceMessage')}
              </Label>
              <Textarea
                id="maintMsg"
                rows={3}
                value={settings.maintenanceMessage}
                onChange={(e) => onChange('maintenanceMessage', e.target.value)}
                className="text-xs"
              />
            </div>
          )}

          <div className="
            flex items-center justify-between rounded-lg border p-4
          "
          >
            <div>
              <p className="font-semibold text-foreground text-xs">{t('systemSettings.general.allowRegistrationTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('systemSettings.general.allowRegistrationDesc')}</p>
            </div>
            <Switch
              checked={settings.allowRegistration}
              onCheckedChange={(checked) => onChange('allowRegistration', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function SecurityTabPane({
  settings,
  onChange,
  t,
}: {
  settings: SettingsState
  onChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  t: (key: string) => string
}) {
  return (
    <TabsContent value="security" className="mt-0 space-y-6">
      <Card className="border shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">{t('systemSettings.security.title')}</CardTitle>
          <CardDescription className="text-xs">{t('systemSettings.security.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="
            flex items-center justify-between rounded-lg border p-4
          "
          >
            <div>
              <p className="font-semibold text-foreground text-xs">{t('systemSettings.security.enforce2FATitle')}</p>
              <p className="text-xs text-muted-foreground">{t('systemSettings.security.enforce2FADesc')}</p>
            </div>
            <Switch
              checked={settings.enforce2FA}
              onCheckedChange={(checked) => onChange('enforce2FA', checked)}
            />
          </div>

          <div className="
            grid gap-6
            sm:grid-cols-3
          "
          >
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('systemSettings.security.sessionTimeout')}</Label>
              <Select value={settings.sessionTimeout} onValueChange={(val) => onChange('sessionTimeout', val ?? '60')}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue>
                    {SESSION_TIMEOUT_LABELS[settings.sessionTimeout] ?? '1시간'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15분</SelectItem>
                  <SelectItem value="30">30분</SelectItem>
                  <SelectItem value="60">1시간</SelectItem>
                  <SelectItem value="1440">24시간</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('systemSettings.security.passwordExpiration')}</Label>
              <Select value={settings.passwordExpiration} onValueChange={(val) => onChange('passwordExpiration', val ?? '90')}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue>
                    {PASSWORD_EXPIRATION_LABELS[settings.passwordExpiration] ?? '90일'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30일</SelectItem>
                  <SelectItem value="60">60일</SelectItem>
                  <SelectItem value="90">90일</SelectItem>
                  <SelectItem value="0">미적용</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('systemSettings.security.maxLoginAttempts')}</Label>
              <Select value={settings.maxLoginAttempts} onValueChange={(val) => onChange('maxLoginAttempts', val ?? '5')}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue>
                    {`${settings.maxLoginAttempts}회 실패 시 계정 임시 잠금`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3회 실패 시 계정 임시 잠금</SelectItem>
                  <SelectItem value="5">5회 실패 시 계정 임시 잠금</SelectItem>
                  <SelectItem value="10">10회 실패 시 계정 임시 잠금</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="
            flex items-center justify-between rounded-lg border p-4
          "
          >
            <div>
              <p className="font-semibold text-foreground text-xs">{t('systemSettings.security.allowConcurrentTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('systemSettings.security.allowConcurrentDesc')}</p>
            </div>
            <Switch
              checked={settings.allowConcurrentSessions}
              onCheckedChange={(checked) => onChange('allowConcurrentSessions', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function LoggingTabPane({
  settings,
  onChange,
  t,
}: {
  settings: SettingsState
  onChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  t: (key: string) => string
}) {
  return (
    <TabsContent value="logging" className="mt-0 space-y-6">
      <Card className="border shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">{t('systemSettings.logging.title')}</CardTitle>
          <CardDescription className="text-xs">{t('systemSettings.logging.description')}</CardDescription>
        </CardHeader>
        <CardContent className="
          grid gap-6 p-6
          sm:grid-cols-2
        "
        >
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.logging.retention')}</Label>
            <Select value={settings.logRetention} onValueChange={(val) => onChange('logRetention', val ?? '30')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {`${settings.logRetention}일 보관`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7일 보관</SelectItem>
                <SelectItem value="14">14일 보관</SelectItem>
                <SelectItem value="30">30일 보관</SelectItem>
                <SelectItem value="90">90일 보관</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.logging.auditLevel')}</Label>
            <Select value={settings.auditLogLevel} onValueChange={(val) => onChange('auditLogLevel', val ?? 'WARN')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {settings.auditLogLevel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">INFO (모든 접근 기록)</SelectItem>
                <SelectItem value="WARN">WARN (의심 및 상태 이상 기록)</SelectItem>
                <SelectItem value="ERROR">ERROR (치명적 오류만 기록)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.logging.streamBuffer')}</Label>
            <Select value={settings.streamBufferSize} onValueChange={(val) => onChange('streamBufferSize', val ?? '100')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {`${settings.streamBufferSize}개 이벤트`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50개 이벤트</SelectItem>
                <SelectItem value="100">100개 이벤트</SelectItem>
                <SelectItem value="200">200개 이벤트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('systemSettings.logging.traceSampling')}</Label>
            <Select value={settings.traceSampling} onValueChange={(val) => onChange('traceSampling', val ?? '50')}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue>
                  {`${settings.traceSampling}% (동적 샘플링)`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10% (경량)</SelectItem>
                <SelectItem value="50">50% (권장)</SelectItem>
                <SelectItem value="100">100% (전수 추적)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function NotificationsTabPane({
  settings,
  onChange,
  onTestWebhook,
  isTestingWebhook,
  t,
}: {
  settings: SettingsState
  onChange: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  onTestWebhook: () => void
  isTestingWebhook: boolean
  t: (key: string) => string
}) {
  return (
    <TabsContent value="notifications" className="mt-0 space-y-6">
      <Card className="border shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">{t('systemSettings.notifications.title')}</CardTitle>
          <CardDescription className="text-xs">{t('systemSettings.notifications.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slackUrl" className="text-xs font-semibold">{t('systemSettings.notifications.slackWebhook')}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={onTestWebhook}
                disabled={isTestingWebhook}
                className="h-7 gap-1 text-xs"
              >
                {isTestingWebhook
                  ? <Loader2 className="size-3 animate-spin" />
                  : (
                    <Send className="size-3" />
                  )}
                {t('systemSettings.testWebhook')}
              </Button>
            </div>
            <Input
              id="slackUrl"
              value={settings.slackWebhookUrl}
              onChange={(e) => onChange('slackWebhookUrl', e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="h-9 font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discordUrl" className="text-xs font-semibold">{t('systemSettings.notifications.discordWebhook')}</Label>
            <Input
              id="discordUrl"
              value={settings.discordWebhookUrl}
              onChange={(e) => onChange('discordWebhookUrl', e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="h-9 font-mono text-xs"
            />
          </div>

          <div className="
            grid gap-6
            sm:grid-cols-2
          "
          >
            <div className="space-y-2">
              <Label htmlFor="alertEmail" className="text-xs font-semibold">{t('systemSettings.notifications.alertEmail')}</Label>
              <Input
                id="alertEmail"
                type="email"
                value={settings.alertEmail}
                onChange={(e) => onChange('alertEmail', e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('systemSettings.notifications.healthInterval')}</Label>
              <Select value={settings.healthCheckInterval} onValueChange={(val) => onChange('healthCheckInterval', val ?? '60')}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue>
                    {`${settings.healthCheckInterval}초 주기`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30초 주기</SelectItem>
                  <SelectItem value="60">60초 주기</SelectItem>
                  <SelectItem value="300">5분 주기</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
