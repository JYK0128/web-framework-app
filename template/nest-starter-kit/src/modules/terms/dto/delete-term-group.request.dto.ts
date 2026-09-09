import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class DeleteTermGroupRequestDto extends EntityDto(TermGroup) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
