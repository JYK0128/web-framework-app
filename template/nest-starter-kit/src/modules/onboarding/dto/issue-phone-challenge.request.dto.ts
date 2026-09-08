import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class IssuePhoneChallengeRequestDto extends DtoType(User) {
  @ApiProperty({ type: 'string', example: '01012345678', description: 'Korean mobile phone number' })
  @IsString()
  @Matches(/^010\d{8}$/)
  phoneNumber!: string;
}
