import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { GetHolidaysResponseDto } from '#/modules/system-configs/dto/get-holidays.response.dto';
import type { OperatingHolidayItemDto } from '#/modules/system-configs/dto/operating-holiday-item.dto';
import { GetHolidaysQuery } from '#/modules/system-configs/queries/get-holidays.query';

const HOLIDAY_CALENDAR_URL = 'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics';
const HOLIDAY_API_TIMEOUT_MS = 6000;
const DATE_REGEX = /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/;
const SUMMARY_REGEX = /SUMMARY:(.+)/;

function parseEvent(block: string, year: string): OperatingHolidayItemDto | null {
  if (!block.includes('END:VEVENT') || (!block.includes('DESCRIPTION:공휴일') && !block.includes('DESCRIPTION:대체공휴일'))) return null;
  const date = DATE_REGEX.exec(block);
  const summary = SUMMARY_REGEX.exec(block);
  if (!date || !summary || date[1] !== year) return null;
  return { date: `${date[1]}-${date[2]}-${date[3]}`, name: summary[1].replace(/\r/g, '').trim(), type: 'STATUTORY' };
}

@Injectable()
@QueryHandler(GetHolidaysQuery)
export class GetHolidaysHandler implements IQueryHandler<GetHolidaysQuery, GetHolidaysResponseDto> {
  async execute(query: GetHolidaysQuery): Promise<GetHolidaysResponseDto> {
    const year = query.input.query.year ?? new Date().getFullYear();
    const response = await fetch(HOLIDAY_CALENDAR_URL, { signal: AbortSignal.timeout(HOLIDAY_API_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`공휴일 캘린더 조회에 실패했습니다: ${response.status}`);
    const text = await response.text();
    const holidays = text.split('BEGIN:VEVENT').map((block) => parseEvent(block, String(year))).filter((holiday): holiday is OperatingHolidayItemDto => Boolean(holiday));
    const unique = Array.from(new Map(holidays.map((holiday) => [holiday.date, holiday])).values()).sort((a, b) => a.date.localeCompare(b.date));
    return { year, count: unique.length, holidays: unique };
  }
}
