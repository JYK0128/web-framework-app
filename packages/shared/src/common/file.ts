/** 파일 업로드 크기 제한 (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FORBIDDEN_FILE_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'sh',
  'php',
  'js',
  'vbs',
  'ps1',
  'jar',
  'msi',
  'com',
  'scr',
  'pif',
  'hta',
  'cpl',
] as const;

const FORBIDDEN_EXTENSIONS_SET = new Set<string>(FORBIDDEN_FILE_EXTENSIONS);

/**
 * 파일 경로, 파일명, 확장자 중 무엇이든 받아 업로드 금지 확장자 여부를 검사합니다.
 *
 * @example
 * isForbiddenExtension('/uploads/malware.exe') // true  (path)
 * isForbiddenExtension('malware.exe')           // true  (fileName)
 * isForbiddenExtension('.exe')                  // true  (ext with dot)
 * isForbiddenExtension('exe')                   // true  (bare ext)
 */
export function isForbiddenExtension(input: string): boolean {
  const fileName = input.split('/').pop() ?? input;
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex >= 0
    ? fileName.slice(dotIndex + 1).toLowerCase()
    : fileName.toLowerCase();
  return FORBIDDEN_EXTENSIONS_SET.has(ext);
}
