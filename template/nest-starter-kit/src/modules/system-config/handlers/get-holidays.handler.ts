import { Injectable, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetHolidaysResponseDto, type HolidayItemDto as HolidayItem } from '#/modules/system-config/dto';
import { GetHolidaysQuery } from '#/modules/system-config/queries/get-holidays.query';

interface RawHolidayItem {
  locdate: number
  isHoliday: string
  dateName?: string
}

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
    const targetYear = query.payload.query?.year ?? new Date().getFullYear();
    const holidays = await this.fetchHolidaysForYear(targetYear);

    return {
      year: targetYear,
      count: holidays.length,
      holidays,
    };
  }

  private async fetchHolidaysForYear(year: number): Promise<HolidayItem[]> {
    // 1. 공공데이터포털 API Key가 설정되어 있는 경우 우선 호출
    const apiKey = process.env.DATA_GO_KR_API_KEY ?? process.env.KASI_API_KEY;
    if (apiKey) {
      const portalHolidays = await this.fetchFromDataPortal(apiKey, year);
      if (portalHolidays.length > 0) {
        return portalHolidays;
      }
    }

    // 2. Google 공식 대한민국 공휴일 퍼블릭 캘린더 iCal 피드 실시간 연동
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
   * 공공데이터포털 특일 정보 조회
   */
  private async fetchFromDataPortal(apiKey: string, year: number): Promise<HolidayItem[]> {
    try {
      const url = new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo');
      url.searchParams.set('serviceKey', apiKey);
      url.searchParams.set('solYear', String(year));
      url.searchParams.set('numOfRows', '100');
      url.searchParams.set('_type', 'json');

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];

      const data = (await response.json()) as {
        response?: {
          body?: {
            items?: {
              item?: RawHolidayItem[] | RawHolidayItem
            }
          }
        }
      };

      const raw = data.response?.body?.items?.item;
      const itemList = [raw].flat().filter(Boolean) as RawHolidayItem[];

      return itemList
        .filter((item) => item.isHoliday === 'Y')
        .map((item) => {
          const str = String(item.locdate);
          return {
            date: `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`,
            name: item.dateName?.trim() || '공휴일',
            type: 'STATUTORY' as const,
          };
        });
    }
    catch (error) {
      this.logger.warn(
        `공공데이터포털 API 조회 실패: ${(error as Error).message}. Google 캘린더 피드로 대체 조회합니다.`,
      );
      return [];
    }
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
