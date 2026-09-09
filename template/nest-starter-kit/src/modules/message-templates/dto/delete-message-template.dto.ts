import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { MessageTemplate } from '#/entities/templates/message-template.entity';

export class DeleteMessageTemplateRequestDto extends EntityDto(MessageTemplate) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override id!: string;
}

@ApiSchema({ name: 'DeleteMessageTemplateResponse' })
export class DeleteMessageTemplateResponseDto {
  @ApiProperty({ type: 'boolean', example: true })
  ok!: boolean;
}
