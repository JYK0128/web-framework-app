import { CreateMessageTemplateHandler } from './create-message-template.handler';
import { DeleteMessageTemplateHandler } from './delete-message-template.handler';
import { GetMessageTemplateByIdHandler } from './get-message-template-by-id.handler';
import { GetMessageTemplatesHandler } from './get-message-templates.handler';
import { RenderTemplatePreviewHandler } from './render-template-preview.handler';
import { TestSendTemplateHandler } from './test-send-template.handler';
import { UpdateMessageTemplateHandler } from './update-message-template.handler';

export { CreateMessageTemplateHandler,
  DeleteMessageTemplateHandler,
  GetMessageTemplateByIdHandler,
  GetMessageTemplatesHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
  UpdateMessageTemplateHandler };

export const messageTemplateHandlers = [
  GetMessageTemplatesHandler,
  GetMessageTemplateByIdHandler,
  CreateMessageTemplateHandler,
  UpdateMessageTemplateHandler,
  DeleteMessageTemplateHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
];
