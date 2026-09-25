import { useSystemConfigsControllerGetOperationNoticeV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { NoticeBanner } from '#/components/notice-banner';

export function OperationNotice() {
  const query = useSystemConfigsControllerGetOperationNoticeV1();
  const message = query.data?.data.message;

  if (!query.isError && !message) return null;

  return (
    <NoticeBanner tone="warning" title={query.isError ? '운영시간 안내' : '고객센터 안내'} dismissible>
      {query.isError ? '현재 운영시간 정보를 불러오지 못했습니다.' : message}
    </NoticeBanner>
  );
}
