import { Injectable, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetHolidaysResponseDto, type OperatingHolidayItemDto as HolidayItem } from '#/modules/system-config/dto';
import { GetHolidaysQuery } from '#/modules/system-config/queries/get-holidays.query';

const DATE_REGEX = /DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/;
const SUMMARY_REGEX = /SUMMARY:(.+)/;

function parseGoogleCalendarEvent(block: string, targetYearStr: string): HolidayItem | null {
  if (!block.includes('END:VEVENT')) return null;

  // 일반 기념일(식목일 등)을 제외하고 법정 공휴일 및 대체공휴일 필터링
  const isPublicHoliday = block.includes('DESCRIPTION:공휴일') || block.includes('DESCRIPTION:대체공휴일');
  if (!isPublicHoliday) return null;

  const dateMatch = DATE_REGEX.exec(block);
  const summaryMatch = SUMMARY_REGEX.exec(block);

  if (!dateMatch || !summaryMatch) return null;

  const eventYear = dateMatch[1];
  if (eventYear !== targetYearStr) return null;

  return {
    date: `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,
    name: summaryMatch[1].replace(/\r/g, '').trim(),
    type: 'STATUTORY',
  };
}

@Injectable()
@QueryHandler(GetHolidaysQuery)
export class GetHolidaysHandler implements IQueryHandler<GetHolidaysQuery, GetHolidaysResponseDto> {
  private readonly logger = new Logger(GetHolidaysHandler.name);

  async execute(query: GetHolidaysQuery): Promise<GetHolidaysResponseDto> {
    const targetYear = query.input.query?.year ?? new Date().getFullYear();
    const holidays = await this.identifyHolidays(targetYear);
    return this.process(targetYear, holidays);
  }

  private async identifyHolidays(targetYear: number): Promise<HolidayItem[]> {
    return this.fetchHolidaysForYear(targetYear);
  }

  private process(year: number, holidays: HolidayItem[]): GetHolidaysResponseDto {
    return {
      year,
      count: holidays.length,
      holidays,
    };
  }

  /**
   * Google 공식 대한민국 공휴일 퍼블릭 캘린더 iCal 피드 실시간 연동
   */
  private async fetchHolidaysForYear(year: number): Promise<HolidayItem[]> {
    try {
      const googleHolidays = await this.fetchFromGoogleCalendar(year);
      if (googleHolidays.length > 0) {
        return googleHolidays;
      }
    }
    catch (error) {
      this.logger.error(
        `Google 공휴일 캘린더 조회 실패: ${(error as Error).message}`,
      );
    }

    return [];
  }

  /**
   * Google Calendar 공식 대한민국 공휴일 iCal(.ics) 피드 파싱
   */
  private async fetchFromGoogleCalendar(year: number): Promise<HolidayItem[]> {
    const calendarUrl = 'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics';

    const response = await fetch(calendarUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SystemConfigApp/1.0)' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Google Calendar iCal HTTP error: ${response.status}`);
    }

    const text = await response.text();
    const eventBlocks = text.split('BEGIN:VEVENT');
    const targetYearStr = String(year);
    const holidayMap = new Map<string, HolidayItem>();

    for (const block of eventBlocks) {
      const item = parseGoogleCalendarEvent(block, targetYearStr);
      if (item && !holidayMap.has(item.date)) {
        holidayMap.set(item.date, item);
      }
    }

    return Array.from(holidayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
