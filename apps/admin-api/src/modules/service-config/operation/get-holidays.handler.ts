import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError, DEFAULT_TIMEZONE } from '@pkg/shared/common';

import { httpClient } from '~/core/http-client';
import { GetHolidaysQuery } from '~/modules/service-config/operation/get-holidays.query';
import { GetHolidaysResponseDto } from '~/modules/service-config/operation/get-holidays.response.dto';
import { OperatingHolidayItemDto } from '~/modules/service-config/operation/operating-holiday-item.dto';

const HOLIDAY_CALENDAR_URL = 'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics';
const DATE_REGEX = /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/;
const SUMMARY_REGEX = /SUMMARY:(.+)/;

function getCurrentBusinessYear(now: Date): number {
  const year = new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIMEZONE, year: 'numeric' })
    .formatToParts(now)
    .find((part) => part.type === 'year')?.value;
  return Number(year);
}

function parseEvent(block: string, year: string): OperatingHolidayItemDto | null {
  if (!block.includes('END:VEVENT') || (!block.includes('DESCRIPTION:공휴일') && !block.includes('DESCRIPTION:대체공휴일'))) return null;
  const date = DATE_REGEX.exec(block);
  const summary = SUMMARY_REGEX.exec(block);
  if (!date || !summary || date[1] !== year) return null;
  return OperatingHolidayItemDto.parse({ date: `${date[1]}-${date[2]}-${date[3]}`, name: summary[1].replace(/\r/g, '').trim(), type: 'STATUTORY' });
}

@Injectable()
@QueryHandler(GetHolidaysQuery)
export class GetHolidaysHandler implements IQueryHandler<GetHolidaysQuery, GetHolidaysResponseDto> {
  async execute(query: GetHolidaysQuery): Promise<GetHolidaysResponseDto> {
    const year = query.input.query.year ?? getCurrentBusinessYear(new Date());
    const response = await httpClient.get<string>(HOLIDAY_CALENDAR_URL, { responseType: 'text' });
    if (response.status < 200 || response.status >= 300) throw ApplicationError.from(new Error(`Holiday calendar responded with HTTP ${response.status}`), { code: 'INTERNAL_SERVICE_CALL_FAILED', status: HttpStatus.BAD_GATEWAY });
    const text = response.data;
    const holidays = text.split('BEGIN:VEVENT').map((block) => parseEvent(block, String(year))).filter((holiday): holiday is OperatingHolidayItemDto => Boolean(holiday));
    const unique = Array.from(new Map(holidays.map((holiday) => [holiday.date, holiday])).values()).sort((a, b) => a.date.localeCompare(b.date));
    return GetHolidaysResponseDto.parse({ year, count: unique.length, items: unique });
  }
}
