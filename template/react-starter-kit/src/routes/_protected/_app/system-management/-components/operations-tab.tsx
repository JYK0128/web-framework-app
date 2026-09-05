import { when } from '@pkg/shared/common';
import { format } from 'date-fns';
import { CalendarDays, CalendarIcon, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { systemConfigControllerGetHolidays } from '#/.generated/api/endpoints/system-config/system-config';
import type { OperatingHolidayItemDto as HolidayItem, OperatingHoursUpdateDto, OperatingMessagesDto, OperationConfigDto } from '#/.generated/api/model';
import { Button, Calendar, Input, Label, Popover, PopoverContent, PopoverTrigger, Switch } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
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
  if (!Array.isArray(raw)) {
    return [];
  }
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
    <div className="grid h-[280px] grid-rows-[auto_1fr] rounded-lg border">
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
  operation?: Partial<OperationConfigDto>
  onSave: (payload: {
    hours: OperatingHoursUpdateDto
    holidays: HolidayItem[]
    messages: OperatingMessagesDto
  }) => Promise<void>
}

export function OperationsTab({
  operation,
  onSave,
}: OperationsTabProps) {
  const { t } = useI18n();
  const hours = operation?.hours;
  const initialHolidays = operation?.holidays ?? [];
  const initialMessages = operation?.messages;
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
        enabled: hours?.lunchBreak?.enabled ?? false,
        start: hours?.lunchBreak?.start ?? '12:00',
        end: hours?.lunchBreak?.end ?? '13:00',
      },
      messages: {
        lunch: initialMessages?.lunch ?? '현재 점심시간입니다. 문의를 남겨주시면 순차적으로 답변드리겠습니다.',
        offHours: initialMessages?.offHours ?? '현재는 운영시간 외입니다. 남겨주신 문의는 다음 영업일 09:00부터 순차 처리됩니다.',
        holiday: initialMessages?.holiday ?? '주말 및 공휴일은 고객센터 휴무입니다. 문의는 다음 영업일에 순차 답변드립니다.',
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
        messages: value.messages,
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
      toast.info('평일 프리셋이 적용되었습니다.');
    }
    else if (preset === 'everyday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('start', '09:00');
      opForm.setFieldValue('end', '18:00');
      toast.info('연중무휴 프리셋이 적용되었습니다.');
    }
    else if (preset === 'extended') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5]);
      opForm.setFieldValue('start', '08:00');
      opForm.setFieldValue('end', '22:00');
      toast.info('연장운영 프리셋이 적용되었습니다.');
    }
    else if (preset === 'allday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('start', '00:00');
      opForm.setFieldValue('end', '24:00');
      toast.info('24시간 프리셋이 적용되었습니다.');
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
    toast.success(t('systemManagement.operations.holidayAddSuccess'));
  };

  const removeHoliday = (dateStr: string) => {
    const currentHolidays = opForm.getFieldValue('holidays');
    const next = currentHolidays.filter((h) => h.date !== dateStr);
    opForm.setFieldValue('holidays', next);
    toast.info(t('systemManagement.operations.holidayRemoveSuccess'));
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
        t('systemManagement.operations.holidayFetchSuccess', {
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
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="clock"
          title={t('systemManagement.operations.hoursTitle')}
          description={t('systemManagement.operations.hoursDescription')}
        >
          <SectionCard.Actions>
            <Button variant="outline" size="sm" onClick={() => applyOperatingPreset('weekday')}>{t('systemManagement.operations.presetWeekday')}</Button>
            <Button variant="outline" size="sm" onClick={() => applyOperatingPreset('everyday')}>{t('systemManagement.operations.presetEveryday')}</Button>
            <Button variant="outline" size="sm" onClick={() => applyOperatingPreset('extended')}>{t('systemManagement.operations.presetExtended')}</Button>
            <Button variant="outline" size="sm" onClick={() => applyOperatingPreset('allday')}>{t('systemManagement.operations.presetAllday')}</Button>
          </SectionCard.Actions>
          <SectionCard.Content className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                {t('systemManagement.operations.selectDays')}
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
                    label={t('systemManagement.operations.startTime')}
                  />
                )}
              </opForm.AppField>

              <opForm.AppField name="end">
                {(f) => (
                  <f.TimePicker
                    label={t('systemManagement.operations.endTime')}
                  />
                )}
              </opForm.AppField>
            </div>

            <opForm.AppField name="messages.offHours">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.offHours')}
                  rows={2}
                />
              )}
            </opForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 점심 및 휴게시간 */}
        <SectionCard variant="ghost" textSize="base" icon="coffee" title={t('systemManagement.operations.lunchTitle')} description={t('systemManagement.operations.lunchDescription')}>
          <SectionCard.Actions>
            <opForm.AppField name="lunchBreak.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.operations.lunchTitle')}
                />
              )}
            </opForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
            <opForm.AppField name="lunchBreak.enabled">
              {(field) => {
                const enabled = field.state.value;
                return (
                  <div
                    className={cn(
                      'grid grid-cols-1 gap-4 transition-opacity',
                      !enabled && 'opacity-60',
                    )}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <opForm.AppField name="lunchBreak.start">
                        {(f) => (
                          <f.TimePicker
                            label={t('systemManagement.operations.lunchStart')}
                            disabled={!enabled}
                          />
                        )}
                      </opForm.AppField>
                      <opForm.AppField name="lunchBreak.end">
                        {(f) => (
                          <f.TimePicker
                            label={t('systemManagement.operations.lunchEnd')}
                            disabled={!enabled}
                          />
                        )}
                      </opForm.AppField>
                    </div>

                    <opForm.AppField name="messages.lunch">
                      {(f) => (
                        <f.Textarea
                          label={t('systemManagement.messages.lunch')}
                          disabled={!enabled}
                          rows={2}
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
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="calendar-days"
          title={t('systemManagement.operations.holidayTitle')}
          description={t('systemManagement.operations.holidayDescription')}
        >
          <SectionCard.Actions>
            <Button variant="outline" size="sm" disabled={isLoadingHolidays} onClick={() => void fetchStatutoryHolidays()}>
              {isLoadingHolidays ? t('systemManagement.operations.fetchingHolidays') : t('systemManagement.operations.fetchHolidays')}
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
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="new-holiday-date"
                    className="text-xs font-medium"
                  >
                    {t('systemManagement.operations.holidayDate')}
                  </Label>
                  {newHolidayDate && (
                    <span className="
                      text-[11px] text-muted-foreground font-medium
                    "
                    >
                      {getDayOfWeekName(newHolidayDate)}
                    </span>
                  )}
                </div>
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
                        <span className="
                          flex items-center gap-1.5 font-medium text-foreground
                        "
                        >
                          <span>{newHolidayDate}</span>
                          <span className="text-muted-foreground font-normal">
                            {getDayOfWeekName(newHolidayDate)}
                          </span>
                        </span>
                      )
                      : (
                        <span className="text-muted-foreground">
                          {t('systemManagement.operations.holidayDate')}
                        </span>
                      )}
                    <CalendarIcon className="size-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                <Label
                  htmlFor="new-holiday-name"
                  className="text-xs font-medium"
                >
                  {t('systemManagement.operations.holidayName')}
                </Label>
                <Input
                  id="new-holiday-name"
                  type="text"
                  placeholder="예: 회사 창립기념일 / 임시공휴일 / 하계휴가"
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
                {t('systemManagement.operations.addHoliday')}
              </Button>
            </div>

            {/* 휴무일 TanStack Table DataGrid */}
            <opForm.AppField name="holidays">
              {(field) => {
                const holidays = field.state.value;
                if (holidays.length === 0) {
                  return (
                    <div className="
                      flex h-[280px] flex-col items-center justify-center
                      rounded-lg border border-dashed text-center text-sm
                      text-muted-foreground
                    "
                    >
                      <CalendarDays className="size-8 opacity-40" />
                      등록된 공휴일 및 휴무일이 없습니다.
                      <p className="text-xs text-muted-foreground/70">
                        상단의 [
                        {t('systemManagement.operations.fetchHolidays')}
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

            {/* 휴일 및 공휴일 안내 메시지 */}
            <opForm.AppField name="messages.holiday">
              {(field) => (
                <field.Textarea
                  label={t('systemManagement.messages.holiday')}
                  rows={2}
                />
              )}
            </opForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </opForm.AppForm>
  );
}
