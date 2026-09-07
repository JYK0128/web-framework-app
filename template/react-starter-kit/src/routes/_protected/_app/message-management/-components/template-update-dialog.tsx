import { FileEdit, Mail, MessageCircle, MessageSquare, Phone, Sparkles } from 'lucide-react';

import type { MessageChannel, MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps, openDialog } from '#/components/dialog';
import { messageChannelVariants } from '#/routes/_protected/_app/message-management/-configs/message-template.config';

import { TemplateEditorForm } from './template-editor-form';
import { TemplateTestSendDialog } from './template-test-send-dialog';

type TemplateUpdateDialogProps = DialogComponentProps<boolean> & {
  template: MessageTemplateItemDto
};

function renderChannelIcon(channel: MessageChannel) {
  switch (channel) {
    case 'EMAIL':
      return <Mail className="size-3" />;
    case 'ALIMTALK':
      return <MessageCircle className="size-3" />;
    case 'SMS':
      return <Phone className="size-3" />;
    case 'SLACK':
      return <MessageSquare className="size-3" />;
    case 'IN_APP':
      return <Sparkles className="size-3" />;
    default:
      return null;
  }
}

export function TemplateUpdateDialog({
  template,
  open,
  onOpenChange,
  close,
}: TemplateUpdateDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="
                flex size-7 items-center justify-center rounded-lg bg-primary/10
                text-primary shrink-0
              "
              >
                <FileEdit className="size-3.5" />
              </div>
              <DialogTitle className="text-base font-bold">
                {template.name}
              </DialogTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {template.code}
              </Badge>
              {template.channels?.map((ch) => {
                const channelKey = (ch.channel ?? 'IN_APP');
                return (
                  <Badge
                    key={ch.id || ch.channel}
                    variant="outline"
                    className={messageChannelVariants({
                      channel: channelKey,
                      className: !ch.isActive ? 'opacity-40 line-through' : '',
                    })}
                  >
                    {renderChannelIcon(channelKey)}
                    <span>{channelKey}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
          {template.description && (
            <DialogDescription>{template.description}</DialogDescription>
          )}
        </DialogHeader>

        <TemplateEditorForm
          template={template}
          onSuccess={() => close?.(true)}
          onOpenTestSend={() => {
            void openDialog(TemplateTestSendDialog, { template }, { dialogId: `test-send-${template.id}` });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
