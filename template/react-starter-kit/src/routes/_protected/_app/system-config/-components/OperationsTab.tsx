import { useI18n } from '@pkg/shared/web';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CalendarDays, CalendarIcon, Clock, Coffee, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { systemConfigControllerGetHolidays } from '#/.generated/api/endpoints/system-config/system-config';
import type { HolidayItemDto as HolidayItem } from '#/.generated/api/model';
import { Badge, Button, Calendar, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { FormLayout, useAppForm } from '#/components/form';

const DAYS_OF_WEEK = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function getDayOfWeekName(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(d.getTime())) return '-';
  return DAY_NAMES[d.getUTCDay()] ?? '-';
}

type HolidayRow = HolidayItem & {
  dayOfWeek: string
};

function parseHolidayItem(item: unknown): HolidayItem | null {
  if (typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)) {
    return {
      date: item,
      name: '법정공휴일',
      type: 'STATUTORY',
    };
  }

  if (item && typeof item === 'object') {
    const obj = item as { date?: unknown, name?: unknown, type?: unknown };
    const dateStr = typeof obj.date === 'string' ? obj.date : '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const nameStr
        = typeof obj.name === 'string' && obj.name.trim()
          ? obj.name.trim()
          : '특별 휴무일';
      return {
        date: dateStr,
        name: nameStr,
        type: obj.type === 'CUSTOM' ? 'CUSTOM' : 'STATUTORY',
      };
    }
  }

  return null;
}

function parseHolidaysArray(raw: unknown[]): HolidayItem[] {
  return raw.map(parseHolidayItem).filter((it): it is HolidayItem => it !== null);
}

function HolidayDataGrid({
  holidays,
  onRemove,
}: {
  holidays: HolidayItem[]
  onRemove: (date: string) => void
}) {
  const { t } = useI18n();
  const [globalFilter, setGlobalFilter] = useState('');

  const data = useMemo<HolidayRow[]>(
    () =>
      holidays.map((item) => ({
        ...item,
        dayOfWeek: getDayOfWeekName(item.date),
      })),
    [holidays],
  );

  const columns = useMemo<ColumnDef<HolidayRow>[]>(
    () => [
      {
        accessorKey: 'date',
        header: t('systemConfig.operations.holidayTableDate'),
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: t('systemConfig.operations.holidayTableName'),
        size: 240,
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'dayOfWeek',
        header: '요일',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: t('systemConfig.operations.holidayTableType'),
        size: 130,
        cell: ({ getValue }) => {
          const type = getValue<string>();
          const isStatutory = type === 'STATUTORY';
          return (
            <Badge
              variant={isStatutory ? 'secondary' : 'outline'}
              className="text-xs font-normal"
            >
              {isStatutory
                ? t('systemConfig.operations.holidayNational')
                : t('systemConfig.operations.holidayCustom')}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: t('systemConfig.operations.holidayTableActions'),
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(row.original.date);
              }}
              className="
                size-8 text-muted-foreground
                hover:text-destructive hover:bg-destructive/10
                cursor-pointer
              "
              title={t('common.cancel')}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onRemove, t],
  );

  const table = useDataGrid({
    cursor: true,
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="
      grid h-[420px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border
    "
    >
      <DataGridToolbar
        table={table}
        searchPlaceholder="휴무일 날짜 또는 명칭 검색..."
      />
      <div className="min-h-0 overflow-hidden">
        <DataGrid table={table} recordName="휴무일" />
      </div>
    </div>
  );
}

export interface OperatingHoursValue {
  openDays: number[]
  openTime: string
  closeTime: string
  lunchEnabled?: boolean
  lunchStart?: string
  lunchEnd?: string
}

export interface OperationsTabProps {
  hours?: Partial<OperatingHoursValue>
  holidays?: HolidayItem[]
  onSave: (payload: {
    hours: OperatingHoursValue
    holidays: HolidayItem[]
  }) => Promise<void>
}

export function OperationsTab({
  hours,
  holidays: initialHolidays = [],
  onSave,
}: OperationsTabProps) {
  const { t } = useI18n();
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const opForm = useAppForm({
    defaultValues: {
      openDays: hours?.openDays ?? [1, 2, 3, 4, 5],
      openTime: hours?.openTime ?? '09:00',
      closeTime: hours?.closeTime ?? '18:00',
      lunchEnabled: Boolean(hours?.lunchEnabled),
      lunchStart: hours?.lunchStart ?? '12:00',
      lunchEnd: hours?.lunchEnd ?? '13:00',
      holidays: parseHolidaysArray(initialHolidays),
    },
    onSubmit: async ({ value }) => {
      await onSave({
        hours: {
          openDays: value.openDays,
          openTime: value.openTime,
          closeTime: value.closeTime,
          lunchEnabled: value.lunchEnabled,
          lunchStart: value.lunchStart,
          lunchEnd: value.lunchEnd,
        },
        holidays: value.holidays,
      });
    },
  });

  const applyOperatingPreset = (
    preset: 'weekday' | 'everyday' | 'extended' | 'allday',
  ) => {
    if (preset === 'weekday') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5]);
      opForm.setFieldValue('openTime', '09:00');
      opForm.setFieldValue('closeTime', '18:00');
      toast.info('평일(월~금 09:00~18:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'everyday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('openTime', '09:00');
      opForm.setFieldValue('closeTime', '18:00');
      toast.info('연중무휴(월~일 09:00~18:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'extended') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5]);
      opForm.setFieldValue('openTime', '08:00');
      opForm.setFieldValue('closeTime', '22:00');
      toast.info('연장운영(월~금 08:00~22:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'allday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('openTime', '00:00');
      opForm.setFieldValue('closeTime', '24:00');
      toast.info('24시간(연중무휴 00:00~24:00) 프리셋이 적용되었습니다.');
    }
  };

  const toggleDay = (dayVal: number) => {
    const current = opForm.getFieldValue('openDays');
    if (current.includes(dayVal)) {
      if (current.length === 1) {
        toast.warning('최소 1개 이상의 영업 요일을 지정해야 합니다.');
        return;
      }
      opForm.setFieldValue(
        'openDays',
        current.filter((d) => d !== dayVal),
      );
    }
    else {
      opForm.setFieldValue('openDays', [...current, dayVal].sort());
    }
  };

  const addHoliday = () => {
    if (!newHolidayDate) {
      toast.error('휴무일 날짜를 선택해 주세요.');
      return;
    }
    const currentHolidays = opForm.getFieldValue('holidays');
    if (currentHolidays.some((h) => h.date === newHolidayDate)) {
      toast.error('이미 등록된 날짜입니다.');
      return;
    }

    const newItem: HolidayItem = {
      date: newHolidayDate,
      name: newHolidayName.trim() || '특별지정휴일',
      type: 'CUSTOM',
    };

    const nextHolidays = [...currentHolidays, newItem].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    opForm.setFieldValue('holidays', nextHolidays);
    setNewHolidayDate('');
    setNewHolidayName('');
    toast.success(t('systemConfig.operations.holidayAddSuccess'));
  };

  const removeHoliday = (dateStr: string) => {
    const currentHolidays = opForm.getFieldValue('holidays');
    const next = currentHolidays.filter((h) => h.date !== dateStr);
    opForm.setFieldValue('holidays', next);
    toast.info(t('systemConfig.operations.holidayRemoveSuccess'));
  };

  const fetchStatutoryHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const year = new Date().getFullYear();
      const fetched = await systemConfigControllerGetHolidays({ year });
      const rawHolidays = fetched?.holidays ?? (fetched as unknown as { items?: unknown[] })?.items ?? [];
      const rawItems = Array.isArray(rawHolidays) ? (rawHolidays as unknown[]) : [];
      const parsedFetched = parseHolidaysArray(rawItems);

      if (parsedFetched.length === 0) {
        toast.warning(`${year}년도 공휴일 정보가 없습니다.`);
        return;
      }

      const currentHolidays = opForm.getFieldValue('holidays');
      const customItems = currentHolidays.filter((it) => it.type === 'CUSTOM');

      const mergedMap = new Map<string, HolidayItem>();
      for (const it of parsedFetched) {
        mergedMap.set(it.date, it);
      }
      for (const it of customItems) {
        mergedMap.set(it.date, it);
      }

      const mergedList = Array.from(mergedMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      opForm.setFieldValue('holidays', mergedList);
      toast.success(
        t('systemConfig.operations.holidayFetchSuccess', {
          year,
          count: parsedFetched.length,
        }),
      );
    }
    catch (err: unknown) {
      toast.error(
        `공휴일 정보를 불러오는 중 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    finally {
      setIsLoadingHolidays(false);
    }
  };

  return (
    <opForm.AppForm>
      <FormLayout
        id="operations-form"
        onSubmit={() => void opForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 기본 운영시간 & 요일 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              {t('systemConfig.operations.hoursTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.operations.hoursDescription')}
            </CardDescription>
            <CardAction>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('weekday')}
                  className="h-8 text-xs cursor-pointer"
                >
                  {t('systemConfig.operations.presetWeekday')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('everyday')}
                  className="h-8 text-xs cursor-pointer"
                >
                  {t('systemConfig.operations.presetEveryday')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('extended')}
                  className="h-8 text-xs cursor-pointer"
                >
                  {t('systemConfig.operations.presetExtended')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('allday')}
                  className="h-8 text-xs cursor-pointer"
                >
                  {t('systemConfig.operations.presetAllday')}
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                {t('systemConfig.operations.selectDays')}
              </Label>
              <div className="flex flex-wrap gap-2">
                <opForm.AppField name="openDays">
                  {(field) => {
                    const days = field.state.value;
                    return (
                      <>
                        {DAYS_OF_WEEK.map((d) => {
                          const isSelected = days.includes(d.value);
                          return (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => toggleDay(d.value)}
                              className={cn(
                                `
                                  flex size-10 items-center justify-center
                                  rounded-lg text-sm font-semibold border
                                  transition-all cursor-pointer select-none
                                `,
                                isSelected
                                  ? `
                                    bg-primary text-primary-foreground
                                    border-primary shadow-xs
                                  `
                                  : `
                                    bg-muted/30 text-muted-foreground
                                    hover:bg-muted/70 hover:text-foreground
                                  `,
                              )}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </>
                    );
                  }}
                </opForm.AppField>
              </div>
            </div>

            <div className="
              grid grid-cols-1
              sm:grid-cols-2
              gap-4
            "
            >
              <opForm.AppField name="openTime">
                {(f) => (
                  <f.TimePicker
                    label={t('systemConfig.operations.startTime')}
                  />
                )}
              </opForm.AppField>

              <opForm.AppField name="closeTime">
                {(f) => (
                  <f.TimePicker
                    label={t('systemConfig.operations.endTime')}
                  />
                )}
              </opForm.AppField>
            </div>
          </CardContent>
        </Card>

        {/* 점심 및 휴게시간 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="size-5 text-primary" />
              {t('systemConfig.operations.lunchTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.operations.lunchDescription')}
            </CardDescription>
            <CardAction>
              <opForm.AppField name="lunchEnabled">
                {(field) => <field.Switch />}
              </opForm.AppField>
            </CardAction>
          </CardHeader>
          <CardContent>
            <opForm.AppField name="lunchEnabled">
              {(field) => {
                const enabled = field.state.value;
                return (
                  <div
                    className={cn(
                      `
                        grid grid-cols-1
                        sm:grid-cols-2
                        gap-4 pt-2 transition-opacity
                      `,
                      !enabled && 'opacity-60',
                    )}
                  >
                    <opForm.AppField name="lunchStart">
                      {(f) => (
                        <f.TimePicker
                          label={t('systemConfig.operations.lunchStart')}
                          disabled={!enabled}
                        />
                      )}
                    </opForm.AppField>
                    <opForm.AppField name="lunchEnd">
                      {(f) => (
                        <f.TimePicker
                          label={t('systemConfig.operations.lunchEnd')}
                          disabled={!enabled}
                        />
                      )}
                    </opForm.AppField>
                  </div>
                );
              }}
            </opForm.AppField>
          </CardContent>
        </Card>

        {/* 휴무일 및 공휴일 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              {t('systemConfig.operations.holidayTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.operations.holidayDescription')}
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchStatutoryHolidays()}
                disabled={isLoadingHolidays}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <RefreshCw
                  className={cn(
                    'size-3.5',
                    isLoadingHolidays && 'animate-spin',
                  )}
                />
                {isLoadingHolidays
                  ? t('systemConfig.operations.fetchingHolidays')
                  : t('systemConfig.operations.fetchHolidays')}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* 휴무일 직접 추가 */}
            <div className="
              flex flex-col gap-3 rounded-lg border bg-muted/20 p-4
              sm:flex-row sm:items-end
            "
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="new-holiday-date" className="text-xs">
                  {t('systemConfig.operations.holidayDate')}
                </Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger
                    render={(
                      <Button
                        id="new-holiday-date"
                        type="button"
                        variant="outline"
                        className="
                          w-full justify-between font-normal h-9 bg-background
                          text-xs
                        "
                      />
                    )}
                  >
                    {newHolidayDate
                      ? (
                        newHolidayDate
                      )
                      : (
                        <span className="text-muted-foreground">
                          {t('systemConfig.operations.holidayDate')}
                        </span>
                      )}
                    <CalendarIcon className="size-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        newHolidayDate
                          ? new Date(newHolidayDate + 'T00:00:00')
                          : undefined
                      }
                      onSelect={(date) => {
                        setNewHolidayDate(
                          date ? format(date, 'yyyy-MM-dd') : '',
                        );
                        setDatePickerOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-2 space-y-1.5">
                <Label htmlFor="new-holiday-name" className="text-xs">
                  {t('systemConfig.operations.holidayName')}
                </Label>
                <Input
                  id="new-holiday-name"
                  type="text"
                  placeholder="예: 회사 창립기념일 / 임시공휴일"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHoliday();
                    }
                  }}
                  className="h-9 bg-background"
                />
              </div>
              <Button
                type="button"
                onClick={addHoliday}
                className="h-9 gap-1.5 cursor-pointer font-medium"
              >
                <Plus className="size-4" />
                {t('systemConfig.operations.addHoliday')}
              </Button>
            </div>

            {/* 휴무일 TanStack Table DataGrid */}
            <opForm.AppField name="holidays">
              {(field) => {
                const holidays = field.state.value;
                if (holidays.length === 0) {
                  return (
                    <div className="
                      flex flex-col items-center justify-center rounded-lg
                      border border-dashed py-12 text-center text-sm
                      text-muted-foreground
                    "
                    >
                      <CalendarDays className="mb-2 size-8 opacity-40" />
                      등록된 공휴일 및 휴무일이 없습니다.
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        상단의 [
                        {t('systemConfig.operations.fetchHolidays')}
                        ]를 누르거나 날짜를 직접 추가하세요.
                      </p>
                    </div>
                  );
                }

                return (
                  <HolidayDataGrid
                    holidays={holidays}
                    onRemove={removeHoliday}
                  />
                );
              }}
            </opForm.AppField>
          </CardContent>
        </Card>
      </FormLayout>
    </opForm.AppForm>
  );
}
