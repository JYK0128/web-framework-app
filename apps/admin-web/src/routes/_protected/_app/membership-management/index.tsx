import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getMembershipsControllerListV1QueryKey, useMembershipsControllerDeleteV1, useMembershipsControllerListV1 } from '#/.generated/api/endpoints/memberships/memberships';
import type { MembershipItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { MembershipEditor } from '../-components/membership-editor-modal';

export const Route = createFileRoute('/_protected/_app/membership-management/')({ component: MembershipManagementPage });

function MembershipManagementPage() {
  const queryClient = useQueryClient();
  const membershipsQuery = useMembershipsControllerListV1();
  const remove = useMembershipsControllerDeleteV1({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getMembershipsControllerListV1QueryKey() }) } });
  const [selectedId, setSelectedId] = useState<string>();
  const memberships = useMemo(() => membershipsQuery.data?.data.items ?? [], [membershipsQuery.data?.data.items]);
  const selected = useMemo(() => memberships.find((membership) => membership.id === selectedId) ?? memberships[0], [memberships, selectedId]);
  const openEditor = (membership?: MembershipItemDto) => {
    void openModal(MembershipEditor, { membership }).then((saved) => { if (saved) void queryClient.invalidateQueries({ queryKey: getMembershipsControllerListV1QueryKey() }); });
  };
  const deleteMembership = async (membership: MembershipItemDto) => {
    if (membership.isSystem || membership.customerCount > 0) return;
    if (await confirm({ title: '멤버십 삭제', description: `${membership.label || membership.code} 멤버십을 삭제하시겠습니까?`, tone: 'danger' })) remove.mutate({ id: membership.id });
  };

  return (
    <PageSection icon="crown" title="멤버십 관리" description="서비스 고객 멤버십과 고객별 적용 기준을 관리합니다.">
      <PageSection.Content className="grid gap-4 p-2 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <SectionCard textSize="sm" title="멤버십 목록" description={`${memberships.length}개의 멤버십`}>
          <SectionCard.Actions><Button type="button" variant="outline" size="sm" onClick={() => openEditor()}><Plus className="size-4" />멤버십 추가</Button></SectionCard.Actions>
          <SectionCard.Content className="scroll-y grid gap-2 p-3">
            {membershipsQuery.isLoading && <p className="p-3 text-sm text-muted-foreground">불러오는 중...</p>}
            {memberships.map((membership) => (
              <button type="button" key={membership.id} onClick={() => setSelectedId(membership.id)} className={`grid gap-1 rounded-lg border p-3 text-left transition-colors ${selected?.id === membership.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'}`}>
                <span className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-primary" />{membership.label || membership.code}{membership.isSystem && <span className="text-[10px] font-normal text-muted-foreground">시스템</span>}</span>
                <span className="text-xs text-muted-foreground">{membership.code} · 고객 {membership.customerCount}명</span>
              </button>
            ))}
          </SectionCard.Content>
        </SectionCard>
        <SectionCard textSize="sm" title={selected ? `${selected.label || selected.code} (${selected.code})` : '멤버십을 선택하세요'} description={selected?.description || '멤버십 설명이 없습니다.'}>
          {selected && <SectionCard.Actions>
            <Button type="button" variant="outline" size="sm" onClick={() => openEditor(selected)}><Pencil className="size-4" />수정</Button>
            <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={selected.isSystem || selected.customerCount > 0 || remove.isPending} onClick={() => void deleteMembership(selected)}><Trash2 className="size-4 text-destructive" />삭제</Button>
          </SectionCard.Actions>}
          <SectionCard.Content className="grid content-start gap-4 overflow-hidden">
            {selected ? <div className="grid gap-4 rounded-lg border p-4"><p className="text-sm font-semibold">멤버십 정보</p><dl className="grid gap-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">코드</dt><dd className="font-mono">{selected.code}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">적용 고객</dt><dd>{selected.customerCount}명</dd></div></dl><div className="grid gap-2 border-t pt-3"><p className="text-sm font-semibold">서비스 권한</p>{selected.permissions.length > 0 ? <div className="flex flex-wrap gap-2">{selected.permissions.map((permission) => <span className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs" key={permission}>{permission}</span>)}</div> : <p className="text-sm text-muted-foreground">부여된 서비스 권한이 없습니다.</p>}</div></div> : <p className="text-sm text-muted-foreground">왼쪽에서 멤버십을 선택하면 상세 정보가 표시됩니다.</p>}
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
