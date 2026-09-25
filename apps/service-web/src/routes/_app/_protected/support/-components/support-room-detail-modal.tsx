import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { getSupportControllerGetRoomV1QueryKey, getSupportControllerListMessagesV1QueryKey, getSupportControllerListRoomsV1QueryKey, useSupportControllerCreateMessageV1, useSupportControllerGetRoomV1, useSupportControllerListMessagesV1, useSupportControllerUpdateRoomV1 } from '#/.generated/api/endpoints/support/support';
import type { SupportMessageItem, SupportRoomItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type SupportRoomDetailModalProps = ModalComponentProps & { room: SupportRoomItem };

export function SupportRoomDetailModal({ room, open, onOpenChange, close }: SupportRoomDetailModalProps) {
  const queryClient = useQueryClient();
  const detail = useSupportControllerGetRoomV1(room.id, { query: { enabled: open } });
  const messages = useSupportControllerListMessagesV1(room.id, { query: { enabled: open, refetchInterval: open ? 5000 : false } });
  const send = useSupportControllerCreateMessageV1();
  const update = useSupportControllerUpdateRoomV1();
  const items = useMemo(() => messages.data?.data.items ?? [], [messages.data?.data.items]);
  const form = useAppForm({
    defaultValues: { content: '' },
    validators: { onSubmit: z.object({ content: z.string().trim().min(1, '메시지를 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      await send.mutateAsync({ roomId: room.id, data: { content: value.content.trim() } });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: getSupportControllerListMessagesV1QueryKey(room.id) });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() });
    },
  });
  const currentRoom = detail.data?.data ?? room;
  const isClosed = currentRoom.status === 'closed';

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !send.isPending && !update.isPending) close?.();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close, open, send.isPending, update.isPending]);

  const closeRoom = async () => {
    await update.mutateAsync({ roomId: room.id, data: { status: 'closed' } });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerGetRoomV1QueryKey(room.id) });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="
        max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
      "
      >
        <Modal.Header>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <Modal.Title>{currentRoom.title}</Modal.Title>
              <Modal.Description>{currentRoom.status === 'closed' ? '종료된 상담' : '고객지원 상담'}</Modal.Description>
            </div>
            {!isClosed && <Button type="button" variant="outline" size="sm" disabled={update.isPending} onClick={() => void closeRoom()}>상담 종료</Button>}
          </div>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          {messages.isLoading && <Skeleton className="h-40 w-full" />}
          {messages.isError && <p className="text-sm text-destructive">메시지를 불러오지 못했습니다.</p>}
          {!messages.isLoading && !messages.isError && (
            <div className="grid gap-3 py-2">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  아직 메시지가 없습니다.
                </p>
              )}
              {items.map((message) => <MessageBubble key={message.id} message={message} />)}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <form.AppForm>
            <FormLayout
              id="support-room-message-form"
              onSubmit={() => void form.handleSubmit()}
              className="
                grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end
                gap-2
                sm:flex-1
                *:col-span-1
              "
            >
              <div className="min-w-0"><form.AppField name="content">{(field) => <field.Textarea aria-label="메시지" placeholder={isClosed ? '종료된 상담입니다.' : '메시지를 입력해 주세요.'} rows={2} showError={false} disabled={isClosed || send.isPending} />}</form.AppField></div>
              <form.Submit disabled={isClosed || send.isPending}>{send.isPending ? '전송 중...' : '전송'}</form.Submit>
            </FormLayout>
          </form.AppForm>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

function MessageBubble({ message }: { message: SupportMessageItem }) {
  const mine = message.senderType === 'user';
  return (
    <div className={`
      flex
      ${mine ? 'justify-end' : 'justify-start'}
    `}
    >
      <div className={`
        max-w-[82%] rounded-2xl border px-4 py-3 text-sm
        ${mine
      ? `border-primary bg-primary text-primary-foreground`
      : `bg-muted/40`}
      `}
      >
        <div className="mb-1 text-xs font-semibold opacity-75">{message.senderName}</div>
        <p className="whitespace-pre-wrap wrap-break-word leading-6">
          {message.content}
        </p>
        <div className="mt-1 text-right text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString('ko-KR')}</div>
      </div>
    </div>
  );
}
