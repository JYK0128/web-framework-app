import type { ColumnDef } from '@tanstack/react-table';
import { CalendarDays, Clock, Coffee, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { systemConfigControllerGetHolidays } from '#/.generated/api/endpoints/system-config/system-config';
import { type HolidayItemDto as HolidayItem } from '#/.generated/api/model';
import { Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '#/.generated/shadcn/components/ui';
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

function normalizeHolidayItems(raw: unknown): HolidayItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseHolidayItem).filter((it): it is HolidayItem => it !== null);
}

function HolidayDataGrid({
  holidays,
  onRemove,
}: {
  holidays: HolidayItem[]
  onRemove: (date: string) => void
}) {
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
        header: '날짜',
        size: 140,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: '공휴일 / 휴무 명칭',
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
        header: '구분',
        size: 130,
        cell: ({ getValue }) => {
          const type = getValue<string>();
          const isStatutory = type === 'STATUTORY';
          return (
            <Badge
              variant={isStatutory ? 'secondary' : 'outline'}
              className="text-xs font-normal"
            >
              {isStatutory ? '법정공휴일' : '특별지정휴일'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '관리',
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
              title="삭제"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onRemove],
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
  start: string
  end: string
  openDays: number[]
  lunchBreak: {
    enabled: boolean
    start: string
    end: string
  }
}

export type OperationsTabProps = {
  hours?: Partial<OperatingHoursValue>
  holidays?: HolidayItem[]
  onSave: (payload: {
    hours: OperatingHoursValue
    holidays: HolidayItem[]
  }) => Promise<void>
};

export function OperationsTab({ hours, holidays, onSave }: OperationsTabProps) {
  const [newHolidayDate, setNewHolidayDate] = useState<string>('');
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  const opForm = useAppForm({
    defaultValues: {
      opStart: hours?.start ?? '09:00',
      opEnd: hours?.end ?? '18:00',
      openDays: hours?.openDays ?? [1, 2, 3, 4, 5],
      lunchEnabled: Boolean(hours?.lunchBreak?.enabled),
      lunchStart: hours?.lunchBreak?.start ?? '12:00',
      lunchEnd: hours?.lunchBreak?.end ?? '13:00',
      holidays: normalizeHolidayItems(holidays),
    },
    onSubmit: async ({ value }) => {
      await onSave({
        hours: {
          start: value.opStart,
          end: value.opEnd,
          openDays: value.openDays,
          lunchBreak: {
            enabled: value.lunchEnabled,
            start: value.lunchStart,
            end: value.lunchEnd,
          },
        },
        holidays: value.holidays,
      });
    },
  });

  // Helper Presets
  const applyOperatingPreset = (type: 'weekday' | 'everyday' | 'extended' | 'allday') => {
    if (type === 'weekday') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5]);
      opForm.setFieldValue('opStart', '09:00');
      opForm.setFieldValue('opEnd', '18:00');
    }
    else if (type === 'everyday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('opStart', '09:00');
      opForm.setFieldValue('opEnd', '18:00');
    }
    else if (type === 'extended') {
      opForm.setFieldValue('openDays', [1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('opStart', '10:00');
      opForm.setFieldValue('opEnd', '20:00');
    }
    else if (type === 'allday') {
      opForm.setFieldValue('openDays', [0, 1, 2, 3, 4, 5, 6]);
      opForm.setFieldValue('opStart', '00:00');
      opForm.setFieldValue('opEnd', '24:00');
    }
  };

  const toggleDay = (day: number) => {
    const current = opForm.getFieldValue('openDays');
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    opForm.setFieldValue('openDays', next);
  };

  const addHoliday = () => {
    const trimmedDate = newHolidayDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
      toast.error('날짜 형식은 YYYY-MM-DD 형태로 입력해주세요 (예: 2026-10-01).');
      return;
    }
    const current = opForm.getFieldValue('holidays');
    if (current.some((h) => h.date === trimmedDate)) {
      toast.error('이미 등록된 날짜입니다.');
      return;
    }
    const holidayName = newHolidayName.trim() || '특별 휴무일';
    const newItems: HolidayItem[] = [
      ...current,
      {
        date: trimmedDate,
        name: holidayName,
        type: 'CUSTOM',
      },
    ].sort((a, b) => a.date.localeCompare(b.date));

    opForm.setFieldValue('holidays', newItems);
    setNewHolidayDate('');
    setNewHolidayName('');
    toast.success(`${trimmedDate} (${holidayName}) 휴무일이 추가되었습니다.`);
  };

  const removeHoliday = (date: string) => {
    const current = opForm.getFieldValue('holidays');
    opForm.setFieldValue(
      'holidays',
      current.filter((h) => h.date !== date),
    );
    toast.info(`${date} 휴무일이 목록에서 삭제되었습니다.`);
  };

  const fetchStatutoryHolidays = async () => {
    try {
      setIsLoadingHolidays(true);
      const targetYear = new Date().getFullYear();
      const nextYear = targetYear + 1;

      const [resCurrent, resNext] = await Promise.all([
        systemConfigControllerGetHolidays({ year: targetYear }),
        systemConfigControllerGetHolidays({ year: nextYear }),
      ]);

      const currentHolidays = resCurrent?.holidays ?? [];
      const nextHolidays = resNext?.holidays ?? [];
      const combined = [...currentHolidays, ...nextHolidays];

      if (combined.length === 0) {
        toast.warning('가져올 수 있는 공휴일 데이터가 없습니다.');
        return;
      }

      const current = opForm.getFieldValue('holidays');
      const holidayMap = new Map<string, HolidayItem>();
      for (const item of current) {
        holidayMap.set(item.date, item);
      }

      let addedCount = 0;
      for (const item of combined) {
        if (!holidayMap.has(item.date)) {
          holidayMap.set(item.date, {
            date: item.date,
            name: item.name,
            type: 'STATUTORY',
          });
          addedCount++;
        }
      }

      const mergedList = Array.from(holidayMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      opForm.setFieldValue('holidays', mergedList);
      toast.success(
        `대한민국 공식 법정/대체공휴일 ${addedCount}건을 새로 반영했습니다 (${targetYear}~${nextYear}년).`,
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
              기본 운영 시간 & 요일
            </CardTitle>
            <CardDescription>
              1:1 실시간 문의 및 고객센터가 정상 운영되는 정규 요일과 시간대를
              지정합니다.
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
                  평일 (월-금)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('everyday')}
                  className="h-8 text-xs cursor-pointer"
                >
                  연중무휴
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('extended')}
                  className="h-8 text-xs cursor-pointer"
                >
                  연장운영
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyOperatingPreset('allday')}
                  className="h-8 text-xs cursor-pointer"
                >
                  24시간
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">영업 요일 선택</Label>
              <div className="flex flex-wrap gap-2">
                <opForm.AppField name="openDays">
                  {(field) => {
                    const days = field.state.value;
                    return (
                      <>
                        {DAYS_OF_WEEK.map((d) => {
                          const isSelected = days.includes(d.value);
                          const isWeekend = d.value === 0 || d.value === 6;
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
                                    border-border
                                    hover:bg-muted/60
                                  `,
                                !isSelected && isWeekend && `
                                  text-destructive/70
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
              <opForm.AppField name="opStart">
                {(field) => (
                  <field.Input
                    label="영업 시작 시간"
                    type="time"
                  />
                )}
              </opForm.AppField>

              <opForm.AppField name="opEnd">
                {(field) => (
                  <field.Input
                    label="영업 종료 시간"
                    type="time"
                  />
                )}
              </opForm.AppField>
            </div>
          </CardContent>
        </Card>

        {/* 점심 / 휴게 시간 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="size-5 text-primary" />
              점심 및 휴게시간 (LUNCH BREAK)
            </CardTitle>
            <CardDescription>
              영업시간 중 상담원이 응대하지 않는 휴게시간을 설정합니다.
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
                  <div className={cn(`
                    grid grid-cols-1
                    sm:grid-cols-2
                    gap-4 pt-2 transition-opacity
                  `, !enabled && `opacity-60`)}
                  >
                    <opForm.AppField name="lunchStart">
                      {(f) => (
                        <f.Input
                          label="점심시간 시작"
                          type="time"
                          disabled={!enabled}
                        />
                      )}
                    </opForm.AppField>
                    <opForm.AppField name="lunchEnd">
                      {(f) => (
                        <f.Input
                          label="점심시간 종료"
                          type="time"
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
              휴무일 및 법정공휴일 관리
            </CardTitle>
            <CardDescription>
              영업 요일과 무관하게 고객센터가 휴무하는 법정공휴일 및 특별 지정
              휴무일을 관리합니다.
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
                공식 법정공휴일 불러오기
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
                  날짜 (YYYY-MM-DD)
                </Label>
                <Input
                  id="new-holiday-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="h-9 bg-background"
                />
              </div>
              <div className="flex-2 space-y-1.5">
                <Label htmlFor="new-holiday-name" className="text-xs">
                  휴무 사유 / 명칭 (선택)
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
                휴무일 추가
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
                        상단의 [공식 법정공휴일 불러오기]를 누르거나 날짜를 직접
                        추가하세요.
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
