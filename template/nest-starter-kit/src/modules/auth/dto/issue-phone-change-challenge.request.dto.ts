import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class IssuePhoneChangeChallengeRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', example: '01012345678', description: 'New Korean mobile phone number' })
  @IsString()
  @Matches(/^010\d{8}$/)
  phoneNumber!: string;
}
