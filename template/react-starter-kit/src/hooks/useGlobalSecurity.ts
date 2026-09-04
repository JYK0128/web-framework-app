import { isForbiddenExtension, MAX_FILE_SIZE } from '@pkg/shared/common';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { useI18n } from '#/hooks/useI18n';

/**
 * 🔒 클라이언트 전역 보안 인터셉터 훅
 *
 * 1. External Link Tabnabbing 방어:
 *    - 사용자가 <a> 태그(마크다운/서드파티 렌더링 포함) 클릭 시,
 *      target="_blank" 또는 외부 도메인 링크에 대해 rel="noopener noreferrer"를 즉시 자동 주입합니다.
 *
 * 2. File Upload / Input 악성 파일 & DoS 1차 방어:
 *    - 모든 <input type="file">의 change 이벤트 발생 시,
 *      악성 스크립트/실행 파일 확장자 및 비정상 대용량 파일 선택을 캡처링 단계에서 가로채고 차단합니다.
 */
export function useGlobalSecurity(): void {
  const { t } = useI18n();

  useEffect(() => {
    // 1. 전역 <a> 태그 클릭 인터셉터 (캡처링 단계)
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');
      const isExternal = href && /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);

      if (targetAttr === '_blank' || isExternal) {
        const currentRel = anchor.getAttribute('rel') || '';
        const rels = new Set(currentRel.split(/\s+/).filter(Boolean));

        if (!rels.has('noopener') || !rels.has('noreferrer')) {
          rels.add('noopener');
          rels.add('noreferrer');
          anchor.setAttribute('rel', Array.from(rels).join(' '));
        }
      }
    };

    // 2. 전역 <input type="file"> change 인터셉터 (캡처링 단계)
    const handleGlobalChange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target || target.type !== 'file' || !target.files || target.files.length === 0) return;

      for (const file of Array.from(target.files)) {
        if (isForbiddenExtension(file.name)) {
          const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
          target.value = '';
          event.stopImmediatePropagation();
          event.preventDefault();
          toast.error(t('core.form.fileBlockedExtension', { ext: `.${ext}` }));
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          target.value = '';
          event.stopImmediatePropagation();
          event.preventDefault();
          toast.error(t('core.form.fileExceedsMaxSize', { maxSize: 50 }));
          return;
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('change', handleGlobalChange, true);

    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('change', handleGlobalChange, true);
    };
  }, [t]);
}
