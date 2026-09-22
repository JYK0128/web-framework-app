import { createFileRoute } from '@tanstack/react-router';

import { useServiceTermsControllerGetTermsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection, PublicLayout, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/service-terms')({ component: PublicServiceTermsPage });

function PublicServiceTermsPage() {
  const query = useServiceTermsControllerGetTermsV1({ page: 1, limit: 100 });
  const terms = query.data?.data.items ?? [];
  return (
    <PublicLayout>
      <div className="
        mx-auto w-full max-w-6xl px-6 py-8
        md:px-8
      "
      >
        <PageSection icon="file-text" title="서비스 약관" description="현재 게시된 고객용 서비스 약관입니다.">
          <PageSection.Content className="
            mx-auto grid w-full max-w-4xl gap-4 pt-2
          "
          >
            {query.isLoading && <Skeleton className="h-32 w-full" />}
            {query.isError && (
              <SectionCard variant="destructive">
                <SectionCard.Content className="p-6 text-destructive">
                  서비스 약관을 불러오지 못했습니다.
                </SectionCard.Content>
              </SectionCard>
            )}
            {!query.isLoading && !query.isError && terms.length === 0 && (
              <SectionCard variant="secondary">
                <SectionCard.Content className="p-6 text-muted-foreground">
                  현재 게시된 서비스 약관이 없습니다.
                </SectionCard.Content>
              </SectionCard>
            )}
            {terms.map((term) => (
              <SectionCard key={term.id} textSize="sm" title={term.title} description={`버전 v${term.version}`}>
                <SectionCard.Content className="
                  whitespace-pre-wrap p-4 text-sm/6
                "
                >
                  {term.content}
                </SectionCard.Content>
              </SectionCard>
            ))}
          </PageSection.Content>
        </PageSection>
      </div>
    </PublicLayout>
  );
}
