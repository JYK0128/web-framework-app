import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { MESSAGE_TEMPLATE_CATALOG } from '#/common/constants/message-template-catalog.constant';
import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

export class MessageTemplateSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const catalogItem of MESSAGE_TEMPLATE_CATALOG) {
      const template = await em.findOne(
        MessageTemplate,
        { code: catalogItem.code },
        { populate: ['channels'] },
      );

      const variableKeys = catalogItem.variables.map((v) => v.key);

      if (!template) {
        const newTemplate = em.create(MessageTemplate, {
          code: catalogItem.code,
          name: catalogItem.name,
          description: catalogItem.description,
          variables: variableKeys,
          isActive: true,
        });
        em.persist(newTemplate);

        for (const channelItem of catalogItem.channels) {
          const channelEntity = em.create(MessageTemplateChannel, {
            template: newTemplate,
            channel: channelItem.channel,
            title: channelItem.defaultTitle,
            body: channelItem.defaultBody,
            priority: channelItem.priority,
            isActive: true,
          });
          em.persist(channelEntity);
        }
      }
      else {
        // 3계층 변수 동기화
        template.variables = variableKeys;

        for (const channelItem of catalogItem.channels) {
          const existingChannel = template.channels.getItems().find((c) => c.channel === channelItem.channel);
          if (existingChannel) {
            existingChannel.title = channelItem.defaultTitle;
            existingChannel.body = channelItem.defaultBody;
            existingChannel.priority = channelItem.priority;
          }
          else {
            const channelEntity = em.create(MessageTemplateChannel, {
              template,
              channel: channelItem.channel,
              title: channelItem.defaultTitle,
              body: channelItem.defaultBody,
              priority: channelItem.priority,
              isActive: true,
            });
            em.persist(channelEntity);
          }
        }
      }
    }
    await em.flush();
  }
}
