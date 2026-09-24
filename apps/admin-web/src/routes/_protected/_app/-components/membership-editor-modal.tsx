import { z } from '@pkg/shared/common';

import { useMembershipsControllerCreateV1, useMembershipsControllerListPermissionsV1, useMembershipsControllerUpdateV1 } from '#/.generated/api/endpoints/memberships/memberships';
import type { MembershipItemDto, MembershipPermissionItemDto } from '#/.generated/api/model';
import { Button, Checkbox, FieldLabel } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm, useFieldContext } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type MembershipEditorProps = ModalComponentProps<boolean> & { membership?: MembershipItemDto };

function PermissionMatrix({ items, isLoading, isError }: { items: MembershipPermissionItemDto[], isLoading: boolean, isError: boolean }) {
  const field = useFieldContext<string[]>();
  const permissions = field.state.value;
  const grouped = items.reduce<Record<string, MembershipPermissionItemDto[]>>((result, item) => {
    (result[item.resource] ??= []).push(item);
    return result;
  }, {});
  const toggle = (code: string) => field.handleChange(permissions.includes(code) ? permissions.filter((value) => value !== code) : [...permissions, code]);
  return (
    <div className="scroll-y grid max-h-72 gap-3 rounded-lg border p-3">
      <div className="flex justify-between text-sm"><span className="font-semibold">서비스 권한</span><span className="text-muted-foreground">선택 {permissions.length}개</span></div>
      {Object.entries(grouped).map(([resource, resourceItems]) => (
        <div className="grid gap-2 border-t pt-3" key={resource}>
          <p className="text-sm font-medium">{resource}</p>
          {resourceItems.map((item) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm" key={item.code}>
              <Checkbox checked={permissions.includes(item.code)} onCheckedChange={() => toggle(item.code)} />
              <FieldLabel><span><span className="block">{item.label}</span><span className="block font-mono text-[10px] text-muted-foreground">{item.code}</span></span></FieldLabel>
            </label>
          ))}
        </div>
      ))}
      {isLoading && <p className="text-sm text-muted-foreground">서비스 권한을 불러오는 중...</p>}
      {!isLoading && isError && <p className="text-sm text-destructive">서비스 권한을 불러오지 못했습니다.</p>}
      {!isLoading && !isError && items.length === 0 && <p className="text-sm text-muted-foreground">등록된 서비스 권한이 없습니다.</p>}
    </div>
  );
}

export function MembershipEditor({ membership, open, onOpenChange, close }: MembershipEditorProps) {
  const create = useMembershipsControllerCreateV1();
  const update = useMembershipsControllerUpdateV1();
  const permissionsQuery = useMembershipsControllerListPermissionsV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: { code: membership?.code ?? '', label: membership?.label ?? '', description: membership?.description ?? '', permissions: membership?.permissions ?? [] },
    validators: { onSubmit: z.object({ code: z.string().trim().min(1, '멤버십 코드를 입력해 주세요.'), label: z.string().trim().min(1, '멤버십 이름을 입력해 주세요.'), description: z.string(), permissions: z.array(z.string()) }) },
    onSubmit: async ({ value }) => {
      const data = { label: value.label.trim(), description: value.description.trim() };
      if (membership) await update.mutateAsync({ id: membership.id, data: { ...data, permissions: value.permissions } });
      else await create.mutateAsync({ data: { code: value.code.trim().toLowerCase(), ...data, permissions: value.permissions } });
      close?.(true);
    },
  });

  return (
    <Modal open={open} onOpenChange={(nextOpen) => { onOpenChange?.(nextOpen); if (!nextOpen && !pending) close?.(false); }}>
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>{membership ? '멤버십 수정' : '멤버십 추가'}</Modal.Title>
          <Modal.Description>서비스 고객에게 적용할 멤버십 정보를 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout onSubmit={() => void form.handleSubmit()} className="grid gap-4 py-2">
            <form.AppField name="code">{(field) => <field.Input label="멤버십 코드" disabled={Boolean(membership) || pending} placeholder="예: vip" required />}</form.AppField>
            <form.AppField name="label">{(field) => <field.Input label="멤버십 이름" disabled={pending} placeholder="예: VIP 회원" required />}</form.AppField>
            <form.AppField name="description">{(field) => <field.Textarea label="설명" disabled={pending} placeholder="멤버십 설명을 입력해 주세요." rows={2} />}</form.AppField>
            <form.AppField name="permissions">{() => <PermissionMatrix items={permissionsQuery.data?.data.items ?? []} isLoading={permissionsQuery.isLoading} isError={permissionsQuery.isError} />}</form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
              <form.Submit disabled={pending || permissionsQuery.isLoading || permissionsQuery.isError}>{pending ? '저장 중...' : '저장'}</form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
