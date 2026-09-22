import { createFileRoute } from '@tanstack/react-router';

import { useServiceTermsControllerGetTermsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection } from '#/components/layout';

export const Route = createFileRoute('/service-terms')({ component: PublicServiceTermsPage });

function PublicServiceTermsPage() {
  const query = useServiceTermsControllerGetTermsV1({ page: 1, limit: 100 });
  const terms = query.data?.data.items ?? [];
  return (
    <div className="size-full p-6 scroll-y">
      <PageSection icon="file-text" title="서비스 약관" description="현재 게시된 고객용 서비스 약관입니다.">
        <PageSection.Content className="grid max-w-4xl gap-4 pt-2">
          {query.isLoading && <Skeleton className="h-32 w-full" />}
          {query.isError && <Card><CardContent className="p-6 text-destructive">서비스 약관을 불러오지 못했습니다.</CardContent></Card>}
          {!query.isLoading && !query.isError && terms.length === 0 && <Card><CardContent className="p-6 text-muted-foreground">현재 게시된 서비스 약관이 없습니다.</CardContent></Card>}
          {terms.map((term) => <Card key={term.id}><CardHeader><CardTitle>{term.title} <span className="text-sm font-normal text-muted-foreground">v{term.version}</span></CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm leading-6">{term.content}</CardContent></Card>)}
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
