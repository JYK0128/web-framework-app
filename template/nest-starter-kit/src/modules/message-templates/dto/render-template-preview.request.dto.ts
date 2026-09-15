import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { MessageChannel } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';

export class RenderTemplatePreviewRequestDto extends EntityDto(MessageTemplateChannel) {
  @ApiEnumOptional({ enum: MessageChannel, description: '미리보기 대상 채널 (미지정 시 1순위 활성 채널)' })
  @IsOptional()
  @IsEnum(MessageChannel)
  override channel?: MessageChannel;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, description: '치환 테스트용 샘플 변수 객체' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;
}
