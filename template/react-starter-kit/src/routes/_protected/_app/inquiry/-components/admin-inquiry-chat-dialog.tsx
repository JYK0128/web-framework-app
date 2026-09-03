import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { getInquiriesControllerGetAdminInquiriesQueryKey, getInquiriesControllerGetAdminInquiryMessagesQueryKey, getInquiriesControllerGetAdminInquiryQueryKey, useInquiriesControllerCreateAdminInquiryMessage, useInquiriesControllerGetAdminInquiryMessages } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiryItemDto, InquiryMessageItemDto, InquiryStatus } from '#/.generated/api/model';

import { type DialogComponentProps } from '#/components/app';

import { appendStreamMessage, emitSocketMessage, joinInquiryRoom } from './inquiry-chat.utils';
import { InquiryChatView } from './inquiry-chat-view';

type AdminInquiryChatDialogProps = DialogComponentProps<void> & {
  inquiry: InquiryItemDto
  onStatusChange?: (status: InquiryStatus) => void
};

export function AdminInquiryChatDialog({
  inquiry,
  onStatusChange,
  open,
  onOpenChange,
  close,
}: AdminInquiryChatDialogProps) {
  const queryClient = useQueryClient();
  const inquiryId = inquiry.id;

  const messagesQuery = useInquiriesControllerGetAdminInquiryMessages(inquiryId, {
    query: { enabled: Boolean(inquiryId) },
  });

  const messageMutation = useInquiriesControllerCreateAdminInquiryMessage();

  const socketRef = useRef<Socket | null>(null);
  const socketReadyRef = useRef(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusOverride, setStatusOverride] = useState<{ id: string, status: InquiryStatus } | null>(null);
  const [assigneeOverride, setAssigneeOverride] = useState<{ id: string, assigneeName: string | null } | null>(null);

  const currentStatus = statusOverride && statusOverride.id === inquiry?.id ? statusOverride.status : inquiry?.status;
  const currentAssigneeName = assigneeOverride && assigneeOverride.id === inquiry?.id ? assigneeOverride.assigneeName : inquiry?.assigneeName;

  const streamKey = `admin:${inquiryId}`;
  const [streamState, setStreamState] = useState<{ key: string, items: InquiryMessageItemDto[] }>({
    key: '',
    items: [],
  });

  const streamedMessages = useMemo(
    () => (streamState.key === streamKey ? streamState.items : []),
    [streamKey, streamState],
  );

  const invalidateList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryMessagesQueryKey(inquiryId) });
    await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryQueryKey(inquiryId) });
  }, [inquiryId, queryClient]);

  useEffect(() => {
    if (!open || !inquiryId) return undefined;

    const socket = io('/inquiries', {
      path: '/api/v1/socket.io',
      withCredentials: true,
      transports: ['websocket'],
      upgrade: false,
    });
    socketRef.current = socket;
    socketReadyRef.current = false;
    let disposed = false;

    const handleConnect = () => {
      if (disposed) {
        socket.disconnect();
        return;
      }
      joinInquiryRoom(socket, inquiryId, true, (success) => {
        if (disposed) return;
        socketReadyRef.current = success;
      });
    };

    const handleMessage = (message: InquiryMessageItemDto) => {
      setStreamState((previous) => appendStreamMessage(previous, streamKey, message));
      if (message.authorRole === 'admin') {
        setStatusOverride({ id: inquiryId, status: 'answered' });
        if (message.authorName) {
          setAssigneeOverride((prev) => (prev?.id === inquiryId ? prev : { id: inquiryId, assigneeName: message.authorName }));
        }
        onStatusChange?.('answered');
      }
      void invalidateList();
    };

    const handleStatusUpdate = (payload: { inquiryId: string, status: InquiryStatus, assigneeName?: string | null }) => {
      if (payload.inquiryId === inquiryId) {
        setStatusOverride({ id: payload.inquiryId, status: payload.status });
        if (payload.assigneeName !== undefined) {
          setAssigneeOverride({ id: payload.inquiryId, assigneeName: payload.assigneeName });
        }
        onStatusChange(payload.status);
        void invalidateList();
      }
    };

    const handleConnectError = () => {
      if (disposed) return;
      socketReadyRef.current = false;
    };

    const handleDisconnect = () => {
      socketReadyRef.current = false;
    };

    socket.on('connect', handleConnect);
    socket.on('inquiry-message', handleMessage);
    socket.on('inquiry-status-changed', handleStatusUpdate);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      disposed = true;
      socketReadyRef.current = false;
      socket.io.opts.reconnection = false;
      socket.off('connect', handleConnect);
      socket.off('inquiry-message', handleMessage);
      socket.off('inquiry-status-changed', handleStatusUpdate);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);

      if (socket.connected) {
        socket.disconnect();
      }
      else {
        socket.once('connect', () => socket.disconnect());
      }

      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [inquiryId, invalidateList, onStatusChange, open, streamKey]);

  const displayMessages = useMemo(() => {
    const fetchedMessages = messagesQuery.data?.items ?? [];
    return [...fetchedMessages, ...streamedMessages].filter((message, index, all) => (
      all.findIndex((item) => item.id === message.id) === index
    ));
  }, [messagesQuery.data?.items, streamedMessages]);

  const handleSendMessage = async () => {
    if (currentStatus === 'closed') return;
    const content = inputText.trim();
    if (!inquiry || !content) return;

    setIsSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected && socketReadyRef.current) {
        await emitSocketMessage(socket, content);
      }
      else {
        await messageMutation.mutateAsync({
          id: inquiry.id,
          data: { content },
        });
      }

      setInputText('');
      setStatusOverride({ id: inquiry.id, status: 'answered' });
      onStatusChange?.('answered');
      await invalidateList();
    }
    catch {
      // Handled globally
    }
    finally {
      setIsSending(false);
    }
  };

  const isPending = isSending || messageMutation.isPending;

  return (
    <InquiryChatView
      open={open}
      onOpenChange={onOpenChange}
      inquiry={inquiry}
      mode="admin"
      messages={displayMessages}
      isLoading={messagesQuery.isLoading}
      isPending={isPending}
      currentStatus={currentStatus}
      currentAssigneeName={currentAssigneeName}
      inputText={inputText}
      onInputChange={setInputText}
      onSendMessage={handleSendMessage}
    />
  );
}
