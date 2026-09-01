import { canBeChoseong, combineCharacter, convertQwertyToHangul } from 'es-hangul';

/**
 * 특수문자를 정규식에서 안전하게 이스케이프
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 검색어에 초성이 포함된 경우 DB 정규식 패턴을 생성하고, 초성이 없으면 null을 반환
 * 예: 'ㄱㅈ' -> '[가-깋][자-짛]'
 * 예: '공ㅈ' -> '공[자-짛]'
 * 예: '공지' -> null (초성 없음)
 */
export function makeChoseongRegexPattern(query: string): string | null {
  let hasChoseong = false;

  const pattern = query
    .split('')
    .map((char) => {
      if (canBeChoseong(char)) {
        hasChoseong = true;
        const start = combineCharacter(char, 'ㅏ');
        const end = combineCharacter(char, 'ㅣ', 'ㅎ');
        return `[${start}-${end}]`;
      }
      return escapeRegex(char);
    })
    .join('');

  return hasChoseong ? pattern : null;
}

export type SearchTokenResult = {
  original: string
  qwertyConverted: string | null
  choseongRegex: string | null
};

/**
 * 통합 검색용 토큰 생성 (영타 오타 보정 + 초성 정규식)
 */
export function parseSearchTokens(query: string): SearchTokenResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return { original: '', qwertyConverted: null, choseongRegex: null };
  }

  // 1. 영타 -> 한글 변환 (예: 'rhdwl' -> '공지')
  const converted = convertQwertyToHangul(trimmed);
  const qwertyConverted = converted !== trimmed ? converted : null;

  // 2. 초성 정규식 패턴 생성 (초성이 포함되어 있으면 pattern 반환, 없으면 null)
  const choseongRegex = makeChoseongRegexPattern(trimmed)
    ?? (qwertyConverted ? makeChoseongRegexPattern(qwertyConverted) : null);

  return {
    original: trimmed,
    qwertyConverted,
    choseongRegex,
  };
}
