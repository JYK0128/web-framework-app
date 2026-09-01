import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class PublishTermRequestDto extends DtoType(Term) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
