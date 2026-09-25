import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { getSupportControllerGetRoomV1QueryKey, getSupportControllerListMessagesV1QueryKey, getSupportControllerListRoomsV1QueryKey, useSupportControllerCreateMessageV1, useSupportControllerCreateRoomV1, useSupportControllerGetRoomV1, useSupportControllerListMessagesV1, useSupportControllerUpdateRoomV1 } from '#/.generated/api/endpoints/support/support';
import type { SupportMessageItem, SupportRoomItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type SupportRoomDetailModalProps = ModalComponentProps & { room?: SupportRoomItem };

export function SupportRoomDetailModal({ room, open, onOpenChange, close }: SupportRoomDetailModalProps) {
  const queryClient = useQueryClient();
  const [createdRoom, setCreatedRoom] = useState<SupportRoomItem>();
  const activeRoom = createdRoom ?? room;
  const detail = useSupportControllerGetRoomV1(activeRoom?.id ?? '', { query: { enabled: open && Boolean(activeRoom) } });
  const messages = useSupportControllerListMessagesV1(activeRoom?.id ?? '', { query: { enabled: open && Boolean(activeRoom), refetchInterval: open && activeRoom ? 5000 : false } });
  const create = useSupportControllerCreateRoomV1();
  const send = useSupportControllerCreateMessageV1();
  const update = useSupportControllerUpdateRoomV1();
  const items = useMemo(() => messages.data?.data.items ?? [], [messages.data?.data.items]);
  const form = useAppForm({
    defaultValues: { content: '' },
    validators: { onSubmit: z.object({ content: z.string().trim().min(1, '메시지를 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      const content = value.content.trim();
      if (activeRoom) {
        await send.mutateAsync({ roomId: activeRoom.id, data: { content } });
        await queryClient.invalidateQueries({ queryKey: getSupportControllerListMessagesV1QueryKey(activeRoom.id) });
      }
      else {
        const result = await create.mutateAsync({ data: { content } });
        setCreatedRoom(result.data);
      }
      form.reset();
      await queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() });
    },
  });
  const currentRoom = detail.data?.data ?? activeRoom;
  const isClosed = currentRoom?.status === 'closed';
  const pending = create.isPending || send.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) close?.();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [close, open, pending]);

  const closeRoom = async () => {
    if (!currentRoom) return;
    await update.mutateAsync({ roomId: currentRoom.id, data: { status: 'closed' } });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerGetRoomV1QueryKey(currentRoom.id) });
    await queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content className="
        h-[80vh] max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]
        sm:max-w-3xl
      "
      >
        <Modal.Header>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0">
              <Modal.Title>{currentRoom?.title ?? '새 상담'}</Modal.Title>
              <Modal.Description>{currentRoom?.status === 'closed' ? '종료된 상담' : '궁금한 점을 남기면 상담원이 도와드립니다.'}</Modal.Description>
            </div>
            {currentRoom && !isClosed && <Button type="button" variant="outline" size="sm" disabled={update.isPending} onClick={() => void closeRoom()}>상담 종료</Button>}
          </div>
        </Modal.Header>
        <Modal.Body className="scroll-y">
          {!currentRoom && <GreetingMessage />}
          {currentRoom && messages.isLoading && <Skeleton className="h-40 w-full" />}
          {currentRoom && messages.isError && <p className="text-sm text-destructive">메시지를 불러오지 못했습니다.</p>}
          {currentRoom && !messages.isLoading && !messages.isError && (
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
              <form.Submit disabled={isClosed || pending}>{pending ? '전송 중...' : '전송'}</form.Submit>
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

function GreetingMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
        <div className="mb-1 text-xs font-semibold opacity-75">시스템</div>
        <p className="whitespace-pre-wrap wrap-break-word leading-6">
          안녕하세요! 무엇을 도와 드릴까요?
          {'\n'}
          궁금한 내용을 남겨 주시면 상담원이 확인해 드리겠습니다.
        </p>
      </div>
    </div>
  );
}
