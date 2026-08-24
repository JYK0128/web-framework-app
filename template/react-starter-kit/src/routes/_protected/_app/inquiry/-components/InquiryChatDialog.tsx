import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Info, Send, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { getInquiriesControllerGetAdminInquiriesQueryKey, getInquiriesControllerGetAdminInquiryMessagesQueryKey, getInquiriesControllerGetAdminInquiryQueryKey, getInquiriesControllerGetInquiriesQueryKey, getInquiriesControllerGetInquiryMessagesQueryKey, getInquiriesControllerGetInquiryQueryKey, useInquiriesControllerCreateAdminInquiryMessage, useInquiriesControllerCreateInquiryMessage, useInquiriesControllerGetAdminInquiryMessages, useInquiriesControllerGetInquiryMessages, useInquiriesControllerUpdateInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiryItemDto, InquiryMessageItemDto, InquiryStatus } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Textarea } from '#/.generated/shadcn/components/ui';

import { InquiryStatusBadge } from './InquiryStatusBadge';

function appendStreamMessage(
  previous: { key: string, items: InquiryMessageItemDto[] },
  streamKey: string,
  message: InquiryMessageItemDto,
): { key: string, items: InquiryMessageItemDto[] } {
  const previousItems = previous.key === streamKey ? previous.items : [];
  return previousItems.some((item) => item.id === message.id)
    ? previous
    : { key: streamKey, items: [...previousItems, message] };
}

function joinInquiryRoom(
  socket: Socket,
  inquiryId: string,
  isAdmin: boolean,
  onResult: (success: boolean) => void,
) {
  socket.timeout(5000).emit('join-inquiry', { inquiryId, admin: isAdmin }, (error: Error | null) => {
    onResult(!error);
  });
}

function emitSocketMessage(socket: Socket, content: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    socket.timeout(5000).emit('send-message', { content }, (error: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

interface InquiryChatDialogProps {
  inquiry: InquiryItemDto | null
  open: boolean
  mode: 'user' | 'admin'
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: InquiryStatus) => void
}

export function InquiryChatDialog({ inquiry, open, mode, onOpenChange, onStatusChange }: InquiryChatDialogProps) {
  const { language, t } = useI18n();
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const queryClient = useQueryClient();
  const isAdmin = mode === 'admin';
  const inquiryId = inquiry?.id ?? '';

  const userMessagesQuery = useInquiriesControllerGetInquiryMessages(inquiryId, {
    query: { enabled: Boolean(inquiryId) && !isAdmin },
  });
  const adminMessagesQuery = useInquiriesControllerGetAdminInquiryMessages(inquiryId, {
    query: { enabled: Boolean(inquiryId) && isAdmin },
  });

  const userMessageMutation = useInquiriesControllerCreateInquiryMessage();
  const adminMessageMutation = useInquiriesControllerCreateAdminInquiryMessage();
  const userUpdateMutation = useInquiriesControllerUpdateInquiry();

  const isLoading = isAdmin ? adminMessagesQuery.isLoading : userMessagesQuery.isLoading;
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const socketReadyRef = useRef(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [statusOverride, setStatusOverride] = useState<{ id: string, status: InquiryStatus } | null>(null);
  const [assigneeOverride, setAssigneeOverride] = useState<{ id: string, assigneeName: string | null } | null>(null);

  const currentStatus = statusOverride && statusOverride.id === inquiry?.id ? statusOverride.status : inquiry?.status;
  const currentAssigneeName = assigneeOverride && assigneeOverride.id === inquiry?.id ? assigneeOverride.assigneeName : inquiry?.assigneeName;

  const streamKey = `${mode}:${inquiryId}`;
  const [streamState, setStreamState] = useState<{ key: string, items: InquiryMessageItemDto[] }>({
    key: '',
    items: [],
  });

  const streamedMessages = useMemo(
    () => (streamState.key === streamKey ? streamState.items : []),
    [streamKey, streamState],
  );

  const invalidateList = useCallback(async () => {
    if (isAdmin) {
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryMessagesQueryKey(inquiryId) });
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryQueryKey(inquiryId) });
    }
    else {
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiryMessagesQueryKey(inquiryId) });
      await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiryQueryKey(inquiryId) });
    }
  }, [inquiryId, isAdmin, queryClient]);

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
      joinInquiryRoom(socket, inquiryId, isAdmin, (success) => {
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

    const handleStatusUpdate = (payload: { inquiryId: string, status: InquiryStatus, assigneeName?: string | null, assigneeId?: string | null }) => {
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
  }, [inquiryId, invalidateList, isAdmin, onStatusChange, open, streamKey]);

  const displayMessages = useMemo(() => {
    const fetchedMessages = isAdmin ? adminMessagesQuery.data?.items ?? [] : userMessagesQuery.data?.items ?? [];
    const messages = [...fetchedMessages, ...streamedMessages].filter((message, index, all) => (
      all.findIndex((item) => item.id === message.id) === index
    ));
    return messages;
  }, [adminMessagesQuery.data?.items, isAdmin, streamedMessages, userMessagesQuery.data?.items]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, open]);

  const handleStatusChange = async (newStatus: InquiryStatus) => {
    if (!inquiry) return;
    const prevOverride = statusOverride;
    setStatusOverride({ id: inquiry.id, status: newStatus });
    onStatusChange(newStatus);
    try {
      await userUpdateMutation.mutateAsync({
        id: inquiry.id,
        data: { status: newStatus },
      });
      await invalidateList();
    }
    catch {
      setStatusOverride(prevOverride);
      if (inquiry.status) onStatusChange(inquiry.status);
    }
  };

  const isClosed = currentStatus === 'closed';

  const handleSendMessage = async () => {
    if (isClosed) return;
    const content = inputText.trim();
    if (!inquiry || !content) return;

    setIsSending(true);
    try {
      const socket = socketRef.current;
      if (socket?.connected && socketReadyRef.current) {
        await emitSocketMessage(socket, content);
      }
      else {
        if (isAdmin) {
          await adminMessageMutation.mutateAsync({
            id: inquiry.id,
            data: { content },
          });
        }
        else {
          await userMessageMutation.mutateAsync({
            id: inquiry.id,
            data: { content },
          });
        }
      }

      setInputText('');
      if (isAdmin) {
        setStatusOverride({ id: inquiry.id, status: 'answered' });
        onStatusChange?.('answered');
      }
      else {
        setStatusOverride({ id: inquiry.id, status: 'pending' });
        onStatusChange?.('pending');
      }
      await invalidateList();
    }
    catch {
      // Handled globally
    }
    finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isClosed) {
        void handleSendMessage();
      }
    }
  };

  const isPending = isSending || userMessageMutation.isPending || adminMessageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="
        sm:max-w-3xl
        max-h-[90vh] h-[820px] flex flex-col
      "
      >
        {/* Header */}
        <DialogHeader className="pr-8 text-left pb-1">
          <div className="
            flex flex-wrap items-center justify-between gap-2.5 mb-1
          "
          >

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {inquiry?.category}
              </Badge>
              {currentStatus && <InquiryStatusBadge status={currentStatus} />}
              {currentAssigneeName
                ? (
                  <Badge
                    variant="secondary"
                    className="font-normal gap-1 text-xs"
                  >
                    <User className="size-3 text-muted-foreground" />
                    <span>
                      {t('inquiries.assignee')}
                      :
                      {' '}
                      {currentAssigneeName}
                    </span>
                  </Badge>
                )
                : (
                  <Badge
                    variant="outline"
                    className="font-normal text-muted-foreground text-xs"
                  >
                    {t('inquiries.assignee')}
                    :
                    {t('inquiries.unassigned')}
                  </Badge>
                )}
            </div>

            {!isAdmin && inquiry && currentStatus !== 'closed' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => void handleStatusChange('closed')}
                disabled={userUpdateMutation.isPending}
              >
                <CheckCircle className="size-3.5 text-muted-foreground" />
                {t('inquiries.closeInquiry')}
              </Button>
            )}
          </div>

          <DialogTitle className="
            text-lg font-bold tracking-tight text-foreground truncate
          "
          >
            {inquiry?.title ?? t('inquiries.chatTitle')}
          </DialogTitle>

          <DialogDescription className="
            flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1
          "
          >
            {isAdmin && (
              <span className="
                flex items-center gap-1 font-medium text-foreground/80
              "
              >
                <User className="size-3 text-muted-foreground" />
                {inquiry?.userName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground" />
              {inquiry?.createdAt ? new Date(inquiry.createdAt).toLocaleString(locale) : ''}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Original Inquiry Content Card */}
        {inquiry?.content && (
          <div className="border-b bg-muted/30 px-6 py-2.5 text-xs">
            <div className="
              flex items-center justify-between font-medium
              text-muted-foreground
            "
            >
              <span className="
                flex items-center gap-1.5 font-semibold text-foreground/80
              "
              >
                <Info className="size-3.5 text-primary" />
                {t('inquiries.originalQuestion')}
              </span>
              <button
                type="button"
                className="
                  text-[11px] font-medium text-muted-foreground
                  hover:text-foreground
                  underline transition-colors
                "
                onClick={() => setShowOriginal(!showOriginal)}
              >
                {showOriginal ? t('inquiries.close') : t('inquiries.view')}
              </button>
            </div>
            {showOriginal && (
              <p className="
                mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md
                border border-border/50 bg-background/80 p-3 leading-relaxed
                text-foreground
              "
              >
                {inquiry.content}
              </p>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div
          ref={scrollRef}
          className="
            flex-1 overflow-y-auto p-6 space-y-3.5 bg-muted/15 min-h-48
          "
        >
          {isLoading && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('inquiries.loading')}
            </p>
          )}
          {!isLoading && displayMessages.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('inquiries.noMessages')}
            </p>
          )}
          {!isLoading && displayMessages.map((message) => {
            const isMyMessage = message.authorRole === mode;
            const isAdminSender = message.authorRole === 'admin';
            return (
              <div
                key={message.id}
                className={`
                  flex shrink-0 items-start
                  ${isMyMessage
                ? 'justify-end'
                : 'justify-start'}
                `}
              >
                <div className={`
                  h-auto min-h-fit w-fit min-w-0 max-w-[82%] shrink-0 self-start
                  rounded-2xl px-4 py-3 text-sm shadow-xs
                  ${isMyMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border text-foreground'}
                `}
                >
                  <div className={`
                    mb-1 flex items-center gap-1.5 text-xs font-semibold
                    ${isMyMessage
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'}
                  `}
                  >
                    <span>{message.authorName}</span>
                    <Badge
                      variant={isAdminSender ? 'default' : 'secondary'}
                      className="px-1.5 py-0 text-[10px] h-4 font-normal"
                    >
                      {isAdminSender ? t('inquiries.admin') : t('inquiries.user')}
                    </Badge>
                  </div>
                  <p className="
                    wrap-break-word whitespace-pre-wrap leading-relaxed
                  "
                  >
                    {message.content}
                  </p>
                  <div className={`
                    mt-1.5 text-[10px]
                    ${isMyMessage
                ? 'text-primary-foreground/70 text-right'
                : 'text-muted-foreground'}
                  `}
                  >
                    {new Date(message.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Composer Area */}
        <div className="border-t bg-card p-4">
          {isClosed && (
            <div className="
              mb-3 flex items-center justify-between rounded-md bg-muted/60 px-3
              py-2 text-xs text-muted-foreground
            "
            >
              <span className="font-medium">{t('inquiries.inquiryClosedNotice')}</span>
            </div>
          )}
          <div className={`
            relative rounded-lg border bg-background shadow-xs
            focus-within:ring-2 focus-within:ring-ring
            focus-within:border-transparent
            transition-all
            ${isClosed ? 'opacity-60 bg-muted/30 cursor-not-allowed' : ''}
          `}
          >
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isClosed ? t('inquiries.inquiryClosedNotice') : t('inquiries.messagePlaceholder')}
              rows={2}
              className="
                min-h-[64px] max-h-32 w-full resize-none border-0 bg-transparent
                p-3 text-sm
                focus-visible:ring-0
                shadow-none
                disabled:cursor-not-allowed
              "
              disabled={isPending || isClosed}
            />
            <div className="
              flex items-center justify-between border-t border-border/40
              bg-muted/15 px-3 py-2
            "
            >
              <span className="
                text-[11px] text-muted-foreground hidden
                sm:inline
              "
              >
                {isClosed
                  ? (
                    t('inquiries.inquiryClosedNotice')
                  )
                  : (
                    <>
                      Enter
                      {' '}
                      {t('inquiries.send')}
                      {' '}
                      · Shift+Enter
                      {' '}
                      {t('inquiries.newLine')}
                    </>
                  )}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {t('inquiries.close')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1.5 text-xs px-3 font-medium"
                  onClick={() => void handleSendMessage()}
                  disabled={isPending || isClosed || !inputText.trim()}
                >
                  <Send className="size-3.5" />
                  {isPending ? t('inquiries.sending') : t('inquiries.send')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
