import { FileEdit, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { messageChannelVariants } from '#/routes/_protected/_app/message-management/-configs/message-template.config';

import { TemplateEditorForm } from './template-editor-form';
import { TemplateTestSendDialog } from './template-test-send-dialog';

interface TemplateUpdateDialogProps {
  template: MessageTemplateItemDto
}

export function TemplateUpdateDialog({
  template,
}: TemplateUpdateDialogProps) {
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [open, setOpen] = useState(Boolean(template));

  if (!open) return null;

  const isEmail = template.channel === 'EMAIL';
  const isSlack = template.channel === 'SLACK';
  const isInApp = template.channel === 'IN_APP';

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="
                  flex size-7 items-center justify-center rounded-lg
                  bg-primary/10 text-primary shrink-0
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
                <Badge
                  variant="secondary"
                  className={messageChannelVariants({
                    channel: template.channel,
                    className: 'border font-medium',
                  })}
                >
                  {isEmail && <Mail className="size-3" />}
                  {isSlack && <MessageSquare className="size-3" />}
                  {isInApp && <Sparkles className="size-3" />}
                  {template.channel}
                </Badge>
              </div>

            </div>
            {template.description && (
              <DialogDescription>{template.description}</DialogDescription>
            )}
          </DialogHeader>

          <TemplateEditorForm
            template={template}
            onSuccess={() => setOpen(false)}
            onOpenTestSend={() => setTestSendOpen(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Encapsulated Test Send Dialog */}
      {testSendOpen && (
        <TemplateTestSendDialog
          template={template}
        />
      )}
    </>
  );
}
