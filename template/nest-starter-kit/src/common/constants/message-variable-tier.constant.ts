import type { TemplateVariableMetadata } from './message-template-catalog.constant';

/**
 * 1계층: 전역 브랜드/회사 상수 (Brand Constants)
 * 시스템 설정 또는 환경변수에서 로드되어 모든 템플릿에 자동 주입됩니다.
 */
export const BRAND_VARIABLES: TemplateVariableMetadata[] = [
  {
    key: 'brand.appName',
    label: '서비스 명칭',
    description: '플랫폼 또는 애플리케이션의 공식 명칭 (자동 주입)',
    required: false,
    sampleValue: 'Antigravity',
  },
  {
    key: 'brand.companyName',
    label: '회사명/상호',
    description: '운영 기업의 공식 상호명 (자동 주입)',
    required: false,
    sampleValue: '(주)안티그래비티',
  },
  {
    key: 'brand.supportEmail',
    label: '고객센터 이메일',
    description: '대표 고객지원 이메일 주소 (자동 주입)',
    required: false,
    sampleValue: 'support@example.com',
  },
  {
    key: 'brand.supportPhone',
    label: '고객센터 전화번호',
    description: '대표 고객지원 문의 전화번호 (자동 주입)',
    required: false,
    sampleValue: '1588-0000',
  },
  {
    key: 'brand.serviceUrl',
    label: '서비스 공식 URL',
    description: '서비스 웹사이트 기본 주소 (자동 주입)',
    required: false,
    sampleValue: 'https://example.com',
  },
];

/**
 * 2계층: 시스템 예약 런타임 변수 (System Runtime Variables)
 * 발송 엔진이 런타임 현재 일시 및 환경을 기반으로 자동 계산하여 주입합니다.
 */
export const SYSTEM_VARIABLES: TemplateVariableMetadata[] = [
  {
    key: 'system.today',
    label: '발송 일자 (YYYY-MM-DD)',
    description: '메시지가 발송되는 현재 일자 (자동 계산)',
    required: false,
    sampleValue: new Date().toISOString().slice(0, 10),
  },
  {
    key: 'system.now',
    label: '발송 일시 (YYYY-MM-DD HH:mm)',
    description: '메시지가 발송되는 현재 시각 (자동 계산)',
    required: false,
    sampleValue: new Date().toISOString().slice(0, 16).replace('T', ' '),
  },
  {
    key: 'system.year',
    label: '발송 연도 (YYYY)',
    description: '현재 연도 (자동 계산)',
    required: false,
    sampleValue: String(new Date().getFullYear()),
  },
];

/**
 * 2계층 시스템 변수의 현재 시점 런타임 맵을 생성합니다.
 */
export function resolveSystemVariables(now: Date = new Date()): Record<string, string> {
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const today = `${yyyy}-${mm}-${dd}`;
  const nowFormatted = `${today} ${hh}:${min}`;

  return {
    'system.today': today,
    'system.now': nowFormatted,
    'system.year': yyyy,
  };
}

/**
 * 기본 브랜드 상수 맵을 반환합니다.
 */
export function resolveDefaultBrandVariables(appName?: string): Record<string, string> {
  const variables = Object.fromEntries(BRAND_VARIABLES.map(({ key, sampleValue }) => [key, sampleValue]));
  if (appName) {
    variables['brand.appName'] = appName;
  }
  return variables;
}
