import { GetMessageTemplateByIdHandler } from './get-message-template-by-id.handler';
import { GetMessageTemplatesHandler } from './get-message-templates.handler';
import { RenderTemplatePreviewHandler } from './render-template-preview.handler';
import { TestSendTemplateHandler } from './test-send-template.handler';
import { UpdateMessageTemplateHandler } from './update-message-template.handler';

export { GetMessageTemplateByIdHandler,
  GetMessageTemplatesHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
  UpdateMessageTemplateHandler };

export const messageTemplateHandlers = [
  GetMessageTemplatesHandler,
  GetMessageTemplateByIdHandler,
  UpdateMessageTemplateHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
];
