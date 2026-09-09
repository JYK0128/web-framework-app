import { CreateMessageTemplateHandler } from './create-message-template.handler';
import { DeleteMessageTemplateHandler } from './delete-message-template.handler';
import { GetMessageTemplateByIdHandler } from './get-message-template-by-id.handler';
import { GetMessageTemplateCatalogHandler } from './get-message-template-catalog.handler';
import { GetMessageTemplatesHandler } from './get-message-templates.handler';
import { RenderTemplatePreviewHandler } from './render-template-preview.handler';
import { TestSendTemplateHandler } from './test-send-template.handler';
import { UpdateMessageTemplateHandler } from './update-message-template.handler';

export { CreateMessageTemplateHandler,
  DeleteMessageTemplateHandler,
  GetMessageTemplateByIdHandler,
  GetMessageTemplateCatalogHandler,
  GetMessageTemplatesHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
  UpdateMessageTemplateHandler };

export const messageTemplateHandlers = [
  GetMessageTemplatesHandler,
  GetMessageTemplateByIdHandler,
  GetMessageTemplateCatalogHandler,
  CreateMessageTemplateHandler,
  UpdateMessageTemplateHandler,
  DeleteMessageTemplateHandler,
  RenderTemplatePreviewHandler,
  TestSendTemplateHandler,
];
