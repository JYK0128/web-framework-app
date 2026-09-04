import { CheckCircle, Clock, Info, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { InquiryItemDto, InquiryMessageItemDto, InquiryStatus } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Textarea } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

import { InquiryStatusBadge } from './inquiry-status-badge';

export interface InquiryChatViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiry: InquiryItemDto | null
  mode: 'user' | 'admin'
  messages: InquiryMessageItemDto[]
  isLoading: boolean
  isPending: boolean
  currentStatus: InquiryStatus | undefined
  currentAssigneeName: string | null | undefined
  inputText: string
  onInputChange: (value: string) => void
  onSendMessage: () => void | Promise<void>
  onCloseInquiry?: () => void | Promise<void>
  isClosing?: boolean
}

export function InquiryChatView({
  open,
  onOpenChange,
  inquiry,
  mode,
  messages,
  isLoading,
  isPending,
  currentStatus,
  currentAssigneeName,
  inputText,
  onInputChange,
  onSendMessage,
  onCloseInquiry,
  isClosing = false,
}: InquiryChatViewProps) {
  const { language, t } = useI18n();
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  const isAdmin = mode === 'admin';
  const isClosed = currentStatus === 'closed';

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isClosed) {
        void onSendMessage();
      }
    }
  };

  if (!open || !inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] h-[820px] flex flex-col">
        {/* Header */}
        <DialogHeader className="text-left">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {inquiry.category}
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
                      {t('inquiry.assignee')}
                      :
                      {currentAssigneeName}
                    </span>
                  </Badge>
                )
                : (
                  <Badge
                    variant="outline"
                    className="font-normal text-muted-foreground text-xs"
                  >
                    {t('inquiry.assignee')}
                    :
                    {t('inquiry.unassigned')}
                  </Badge>
                )}
            </div>

            {!isAdmin && onCloseInquiry && currentStatus !== 'closed' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => void onCloseInquiry()}
                disabled={isClosing}
              >
                <CheckCircle className="size-3.5 text-muted-foreground" />
                {t('inquiry.closeInquiry')}
              </Button>
            )}
          </div>

          <DialogTitle className="
            text-lg font-bold tracking-tight text-foreground truncate
          "
          >
            {inquiry.title ?? t('inquiry.chatTitle')}
          </DialogTitle>

          <DialogDescription className="
            flex flex-wrap items-center gap-4 text-xs text-muted-foreground
          "
          >
            {isAdmin && (
              <span className="
                flex items-center gap-1 font-medium text-foreground/80
              "
              >
                <User className="size-3 text-muted-foreground" />
                {inquiry.userName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground" />
              {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString(locale) : ''}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Original Inquiry Content Card */}
        {inquiry.content && (
          <div className="border-b bg-muted/30 text-xs">
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
                {t('inquiry.originalQuestion')}
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
                {showOriginal ? t('app.dialog.close') : t('inquiry.view')}
              </button>
            </div>
            {showOriginal && (
              <p className="
                max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border
                border-border/50 bg-background/80 leading-relaxed
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
          className="flex-1 overflow-y-auto bg-muted/15"
        >
          {isLoading && (
            <p className="text-center text-sm text-muted-foreground">
              {t('inquiry.loading')}
            </p>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {t('inquiry.noMessages')}
            </p>
          )}
          {!isLoading && messages.map((message) => {
            const isMyMessage = message.authorRole === mode;
            const isAdminSender = message.authorRole === 'admin';
            return (
              <div
                key={message.id}
                className={`
                  flex shrink-0 items-start
                  ${isMyMessage ? 'justify-end' : 'justify-start'}
                `}
              >
                <div className={`
                  h-auto w-fit max-w-[82%] shrink-0 self-start rounded-2xl
                  text-sm shadow-xs
                  ${isMyMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border text-foreground'}
                `}
                >
                  <div className={`
                    flex items-center gap-1.5 text-xs font-semibold
                    ${isMyMessage
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'}
                  `}
                  >
                    <span>{message.authorName}</span>
                    <Badge
                      variant={isAdminSender ? 'default' : 'secondary'}
                      className="text-[10px] h-4 font-normal"
                    >
                      {isAdminSender ? t('inquiry.admin') : t('inquiry.user')}
                    </Badge>
                  </div>
                  <p className="
                    wrap-break-word whitespace-pre-wrap leading-relaxed
                  "
                  >
                    {message.content}
                  </p>
                  <div className={`
                    text-[10px]
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
        <div className="border-t bg-card">
          {isClosed && (
            <div className="
              flex items-center justify-between rounded-md bg-muted/60 text-xs
              text-muted-foreground
            "
            >
              <span className="font-medium">{t('inquiry.inquiryClosedNotice')}</span>
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
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isClosed ? t('inquiry.inquiryClosedNotice') : t('inquiry.messagePlaceholder')}
              rows={2}
              className="
                max-h-32 w-full resize-none border-0 bg-transparent text-sm
                focus-visible:ring-0
                shadow-none
                disabled:cursor-not-allowed
              "
              disabled={isPending || isClosed}
            />
            <div className="
              flex items-center justify-between border-t border-border/40
              bg-muted/15
            "
            >
              <span className="text-[11px] text-muted-foreground hidden">
                {isClosed
                  ? (
                    t('inquiry.inquiryClosedNotice')
                  )
                  : (
                    <>
                      Enter
                      {' '}
                      {t('inquiry.send')}
                      {' '}
                      · Shift+Enter
                      {' '}
                      {t('inquiry.newLine')}
                    </>
                  )}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {t('app.dialog.close')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1.5 text-xs font-medium"
                  onClick={() => void onSendMessage()}
                  disabled={isPending || isClosed || !inputText.trim()}
                >
                  <Send className="size-3.5" />
                  {isPending ? t('inquiry.sending') : t('inquiry.send')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
