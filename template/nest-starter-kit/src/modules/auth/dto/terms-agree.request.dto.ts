import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

import { EntityType } from '#/common/dto/entity-dto';
import { Verification } from '#/entities/auth/verification.entity';

export class TermsAgreeRequestDto extends EntityType(Verification) {
  @ApiProperty({ description: 'List of agreed term IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  agreedTermIds!: string[];

  token!: string;
}
