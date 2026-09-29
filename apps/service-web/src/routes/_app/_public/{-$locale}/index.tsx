import { createFileRoute } from '@tanstack/react-router';

import { LinkButton, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_app/_public/{-$locale}/')({
  component: () => (
    <>
      <div className="
        mx-auto grid size-full w-full max-w-6xl content-center gap-6 px-4 py-10
        md:px-6
      "
      >
        <SectionCard textSize="lg" title="Service Web" description="서비스의 주요 콘텐츠를 먼저 확인해 보세요.">
          <SectionCard.Content className="
            grid gap-4 p-6 text-sm text-muted-foreground
          "
          >
            <p>FAQ와 서비스 약관은 로그인 없이 확인할 수 있습니다. 서비스 기능을 이용하려면 로그인해 주세요.</p>
            <div className="flex justify-end gap-2">
              <LinkButton variant="outline" to="/qna">Q&A 문의</LinkButton>
              <LinkButton variant="outline" to="/login">로그인</LinkButton>
            </div>
          </SectionCard.Content>
        </SectionCard>
      </div>
    </>
  ),
});
