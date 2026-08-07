import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Bot, Hash, Menu, Paperclip, Phone, Send, Smile, Sparkles, Users, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, Input, ScrollArea } from '#/.generated/shadcn/components/ui';
import { type Channel, type ChatMessage, createInitialMessages, CURRENT_USER, MOCK_CHANNELS, MOCK_USERS, simulateIncomingChatMessage } from '#/routes/example/-api/realtime-chat-mock';

export const Route = createFileRoute('/example/chat/')({
  component: ChatExamplePage,
});

function ChatExamplePage() {
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string>('dev-team');
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChannel = MOCK_CHANNELS.find((c) => c.id === activeChannelId) ?? MOCK_CHANNELS[0];

  // TanStack Query Cache Subscription for active channel messages
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', activeChannelId],
    queryFn: () => {
      const existing = queryClient.getQueryData<ChatMessage[]>(['chat-messages', activeChannelId]);
      if (existing) return existing;
      const initial = createInitialMessages(activeChannelId);
      queryClient.setQueryData(['chat-messages', activeChannelId], initial);
      return initial;
    },
  });

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Select channel callback
  const handleSelectChannel = (id: string) => {
    setActiveChannelId(id);
    setIsMobileMenuOpen(false);
  };

  // Send message action
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannelId,
      sender: CURRENT_USER,
      content: inputValue.trim(),
      timestamp,
    };

    // Instant optimistic update via TanStack Query cache
    queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeChannelId], (prev = []) => [
      ...prev,
      newMsg,
    ]);

    const sentContent = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate real-time response from AI or Teammate
    simulateIncomingChatMessage(activeChannelId, sentContent, (incomingMsg) => {
      setIsTyping(false);
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeChannelId], (prev = []) => [
        ...prev,
        incomingMsg,
      ]);
    });
  };

  return (
    <main
      className="
        fixed inset-0 z-10 flex flex-col overflow-hidden bg-background p-0
        md:static md:mx-auto md:h-dvh md:max-w-7xl md:p-6
      "
    >
      <Card className="
        flex min-h-0 flex-1 overflow-hidden rounded-none border-0 shadow-none
        md:rounded-xl md:border md:shadow-lg
      "
      >
        {/* Mobile Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div
            className="
              fixed inset-0 z-40 bg-background/80 backdrop-blur-sm
              md:hidden
            "
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Component (Desktop fixed, Mobile Slide-over Drawer) */}
        <ChatSidebar
          channels={MOCK_CHANNELS}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Chat Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {/* Mobile & Desktop Header */}
          <div className="
            flex h-14 items-center justify-between border-b px-3 py-2.5
            sm:h-16 sm:px-6 sm:py-3
          "
          >
            <div className="
              flex items-center gap-2.5
              sm:gap-3
            "
            >
              {/* Mobile Menu Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="
                  size-9 shrink-0 text-muted-foreground
                  md:hidden
                "
              >
                <Menu className="size-5" />
              </Button>

              <div className="
                flex size-8 items-center justify-center rounded-lg bg-primary/10
                text-primary
                sm:size-9
              "
              >
                {activeChannel.id === 'ai-assistant'
                  ? (
                    <Bot className="
                      size-4
                      sm:size-5
                    "
                    />
                  )
                  : (
                    <Hash className="
                      size-4
                      sm:size-5
                    "
                    />
                  )}
              </div>
              <div className="min-w-0">
                <div className="
                  flex items-center gap-1.5
                  sm:gap-2
                "
                >
                  <h2 className="
                    truncate text-sm font-bold text-foreground
                    sm:text-base
                  "
                  >
                    {activeChannel.name}
                  </h2>
                  {activeChannel.id === 'ai-assistant' && (
                    <Badge
                      variant="secondary"
                      className="
                        gap-1 border-purple-500/20 px-1.5 py-0 text-[10px]
                        text-purple-600 bg-purple-500/10
                        sm:px-2 sm:py-0.5
                      "
                    >
                      <Sparkles className="size-3" />
                      AI Live
                    </Badge>
                  )}
                </div>
                <p className="
                  hidden truncate text-xs text-muted-foreground
                  sm:block
                "
                >
                  {activeChannel.description}
                </p>
              </div>
            </div>

            <div className="
              flex items-center gap-1
              sm:gap-2
            "
            >
              <div className="
                hidden items-center -space-x-2
                sm:flex
              "
              >
                {MOCK_USERS.map((user) => (
                  <Avatar
                    key={user.id}
                    className="size-7 border-2 border-background"
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="size-8">
                <Phone className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8">
                <Video className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages Viewport */}
          <div
            ref={scrollRef}
            className="
              flex-1 space-y-3.5 overflow-y-auto overscroll-y-contain
              touch-pan-y p-3.5
              sm:space-y-4 sm:p-6
            "
          >
            <div className="my-2 flex justify-center">
              <span className="
                rounded-full bg-muted px-3 py-1 text-[11px] font-medium
                text-muted-foreground
              "
              >
                오늘
              </span>
            </div>

            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="
                flex items-center gap-2 text-xs text-muted-foreground
                animate-pulse
              "
              >
                <Bot className="size-4 text-purple-500" />
                <span>
                  {activeChannelId === 'ai-assistant' ? 'Antigravity AI가 답변을 작성 중입니다...' : '팀원이 입력 중입니다...'}
                </span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="
            border-t bg-muted/20 p-2.5
            sm:p-4
          "
          >
            <div className="
              flex items-center gap-1.5 rounded-xl border bg-background px-2.5
              py-1.5 shadow-sm
              focus-within:ring-2 focus-within:ring-primary/20
              sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2
            "
            >
              <Button
                variant="ghost"
                size="icon"
                className="
                  size-8 text-muted-foreground shrink-0
                  sm:size-8
                "
              >
                <Paperclip className="size-4" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeChannelId === 'ai-assistant'
                    ? 'AI에게 질문하기...'
                    : `#${activeChannel.name}에 메시지 전송`
                }
                className="
                  h-9 border-0 bg-transparent px-1 text-base shadow-none
                  focus-visible:ring-0
                  md:text-sm
                "
              />
              <Button
                variant="ghost"
                size="icon"
                className="
                  hidden size-8 text-muted-foreground shrink-0
                  sm:inline-flex
                "
              >
                <Smile className="size-4" />
              </Button>
              <Button
                size="icon"
                disabled={!inputValue.trim()}
                onClick={handleSendMessage}
                className="size-8 shrink-0 rounded-lg"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}

// Sub-components at bottom

function ChatSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  isMobileMenuOpen,
  onCloseMobileMenu,
}: {
  channels: Channel[]
  activeChannelId: string
  onSelectChannel: (id: string) => void
  isMobileMenuOpen: boolean
  onCloseMobileMenu: () => void
}) {
  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background
        transition-transform duration-300 ease-in-out
        md:static md:w-64 md:translate-x-0 md:bg-muted/30
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}
    >
      <div className="
        flex h-14 items-center justify-between border-b px-4 text-sm font-bold
        sm:h-16
      "
      >
        <div className="flex items-center">
          <Users className="mr-2 size-4 text-primary" />
          워크스페이스 채널
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseMobileMenu}
          className="
            size-8 text-muted-foreground
            md:hidden
          "
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <p className="
            px-2 text-[11px] font-semibold text-muted-foreground uppercase
          "
          >
            채널 목록
          </p>
          {channels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectChannel(ch.id)}
                className={`
                  flex w-full items-center justify-between rounded-lg px-3
                  py-2.5 text-sm font-medium transition-colors
                  sm:py-2
                  ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : `
                  text-muted-foreground
                  hover:bg-muted hover:text-foreground
                `
              }
                `}
              >
                <div className="flex items-center gap-2">
                  {ch.id === 'ai-assistant'
                    ? <Bot className="size-4" />
                    : (
                      <Hash className="size-4" />
                    )}
                  <span>{ch.name}</span>
                </div>
                {ch.unreadCount > 0 && !isActive && (
                  <Badge
                    variant="destructive"
                    className="
                      flex size-5 items-center justify-center rounded-full p-0
                      text-[10px]
                    "
                  >
                    {ch.unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-1">
          <p className="
            px-2 text-[11px] font-semibold text-muted-foreground uppercase
          "
          >
            온라인 멤버
          </p>
          {MOCK_USERS.map((user) => (
            <div
              key={user.id}
              className="
                flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs
              "
            >
              <div className="relative">
                <Avatar className="size-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <span className={`
                  absolute -bottom-0.5 -right-0.5 size-2 rounded-full border
                  border-background
                  ${user.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}
                `}
                />
              </div>
              <div className="truncate">
                <p className="truncate font-medium text-foreground">{user.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user.role}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function getBubbleStyle(isMe: boolean, isAi?: boolean): string {
  if (isMe) {
    return 'bg-primary text-primary-foreground rounded-tr-none';
  }
  if (isAi) {
    return 'bg-purple-500/10 border border-purple-500/20 text-foreground rounded-tl-none';
  }
  return 'bg-muted/70 text-foreground rounded-tl-none border';
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isMe = message.sender.id === CURRENT_USER.id;

  return (
    <div className={`
      flex gap-2.5
      sm:gap-3
      ${isMe ? 'flex-row-reverse' : 'flex-row'}
    `}
    >
      <Avatar className="
        mt-0.5 size-7 shrink-0
        sm:size-8
      "
      >
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
      </Avatar>

      <div className={`
        flex flex-col max-w-[85%]
        sm:max-w-[75%]
        ${isMe
      ? 'items-end'
      : `items-start`}
      `}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{message.sender.name}</span>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
        </div>

        <div
          className={`
            rounded-2xl px-3.5 py-2 text-sm shadow-sm whitespace-pre-wrap
            sm:px-4 sm:py-2.5
            ${getBubbleStyle(isMe, message.isAi)}
          `}
        >
          {message.content}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {message.reactions.map((r, i) => (
              <span
                key={i}
                className={`
                  inline-flex items-center gap-1 rounded-full px-2 py-0.5
                  text-xs border
                  ${r.reacted
                ? 'bg-primary/10 border-primary/30 text-primary'
                : `bg-muted text-muted-foreground`}
                `}
              >
                <span>{r.emoji}</span>
                <span className="font-medium">{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
