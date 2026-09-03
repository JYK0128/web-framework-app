import { when } from '@pkg/shared/common';
import { format } from 'date-fns';
import { CalendarDays, CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { systemConfigControllerGetHolidays } from '#/.generated/api/endpoints/system-config/system-config';
import type { OperatingHolidayItemDto as HolidayItem, OperatingHoursDto, OperatingHoursUpdateDto } from '#/.generated/api/model';
import { Button, Calendar, Input, Label, Popover, PopoverContent, PopoverTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { SectionCard } from '#/components/app';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';
import { DAY_NAMES, DAYS_OF_WEEK } from '#/routes/_protected/_app/system-management/-configs/operations.config';
import { createOperationsColumns } from '#/routes/_protected/_app/system-management/-configs/operations-columns.config';

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
  const { i18n } = useI18n();

  const data = useMemo<HolidayRow[]>(
    () =>
      holidays.map((item) => ({
        ...item,
        dayOfWeek: getDayOfWeekName(item.date),
      })),
    [holidays],
  );

  const columns = useMemo(() => createOperationsColumns(i18n, onRemove), [i18n, onRemove]);

  const table = useDataGrid({
    client: true,
    data,
    columns,
  });

  return (
    <div className="grid h-[420px] grid-rows-[auto_1fr] rounded-lg border">
      <DataGridToolbar
        table={table}
        searchPlaceholder="휴무일 날짜 또는 명칭 검색..."
      />
      <div>
        <DataGrid table={table} />
      </div>
    </div>
  );
}

export interface OperationsTabProps {
  hours?: OperatingHoursDto
  holidays?: HolidayItem[]
  onSave: (payload: {
    hours: OperatingHoursUpdateDto
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
      start: hours?.start ?? '09:00',
      end: hours?.end ?? '18:00',
      lunchBreak: {
        enabled: hours?.lunchBreak.enabled ?? false,
        start: hours?.lunchBreak.start ?? '12:00',
        end: hours?.lunchBreak.end ?? '13:00',
      },
      holidays: parseHolidaysArray(initialHolidays),
    },
    onSubmit: async ({ value }) => {
      await onSave({
        hours: {
          openDays: value.openDays,
          start: value.start,
          end: value.end,
          lunchBreak: value.lunchBreak,
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
      opForm.setFieldValue('start', '09:00');
      opForm.setFieldValue('end', '18:00');
      toast.info('평일(월~금 09:00~18:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'everyday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('start', '09:00');
      opForm.setFieldValue('end', '18:00');
      toast.info('연중무휴(월~일 09:00~18:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'extended') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5]);
      opForm.setFieldValue('start', '08:00');
      opForm.setFieldValue('end', '22:00');
      toast.info('연장운영(월~금 08:00~22:00) 프리셋이 적용되었습니다.');
    }
    else if (preset === 'allday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('start', '00:00');
      opForm.setFieldValue('end', '24:00');
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
      const parsedFetched = parseHolidaysArray(fetched.holidays);

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
        className="flex flex-col"
      >
        {/* 기본 운영시간 & 요일 */}
        <SectionCard variant="ghost" textSize="base" icon="clock" title={t('systemConfig.operations.hoursTitle')} description={t('systemConfig.operations.hoursDescription')}>
          <SectionCard.Actions>
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
          </SectionCard.Actions>
          <SectionCard.Content className="flex flex-col gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <opForm.AppField name="start">
                {(f) => (
                  <f.TimePicker
                    label={t('systemConfig.operations.startTime')}
                  />
                )}
              </opForm.AppField>

              <opForm.AppField name="end">
                {(f) => (
                  <f.TimePicker
                    label={t('systemConfig.operations.endTime')}
                  />
                )}
              </opForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 점심 및 휴게시간 */}
        <SectionCard variant="ghost" textSize="base" icon="coffee" title={t('systemConfig.operations.lunchTitle')} description={t('systemConfig.operations.lunchDescription')}>
          <SectionCard.Actions>
            <opForm.AppField name="lunchBreak.enabled">
              {(field) => <field.Switch />}
            </opForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
            <opForm.AppField name="lunchBreak.enabled">
              {(field) => {
                const enabled = field.state.value;
                return (
                  <div
                    className={cn(
                      `grid grid-cols-2 gap-4 transition-opacity`,
                      !enabled && 'opacity-60',
                    )}
                  >
                    <opForm.AppField name="lunchBreak.start">
                      {(f) => (
                        <f.TimePicker
                          label={t('systemConfig.operations.lunchStart')}
                          disabled={!enabled}
                        />
                      )}
                    </opForm.AppField>
                    <opForm.AppField name="lunchBreak.end">
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
          </SectionCard.Content>
        </SectionCard>

        {/* 휴무일 및 공휴일 관리 */}
        <SectionCard variant="ghost" textSize="base" icon="calendar-days" title={t('systemConfig.operations.holidayTitle')} description={t('systemConfig.operations.holidayDescription')}>
          <SectionCard.Actions>
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
          </SectionCard.Actions>
          <SectionCard.Content className="flex flex-col">
            {/* 휴무일 직접 추가 */}
            <div className="
              grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-end gap-3
              rounded-lg border bg-muted/20 p-4
            "
            >
              <div className="flex flex-col gap-1.5">
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
                  <PopoverContent className="w-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={when((value): value is string => Boolean(value), (date) => new Date(date + 'T00:00:00'))(newHolidayDate)}
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

              <div className="flex flex-col gap-1.5">
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
                      flex h-[420px] flex-col items-center justify-center
                      rounded-lg border border-dashed text-center text-sm
                      text-muted-foreground
                    "
                    >
                      <CalendarDays className="size-8 opacity-40" />
                      등록된 공휴일 및 휴무일이 없습니다.
                      <p className="text-xs text-muted-foreground/70">
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
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </opForm.AppForm>
  );
}
