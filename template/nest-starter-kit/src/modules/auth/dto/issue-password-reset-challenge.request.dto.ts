import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { ToLowerCase } from '#/common/decorators/to-lower-case.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'IssuePasswordResetChallengeRequest' })
export class IssuePasswordResetChallengeRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', format: 'email', description: '가입 이메일 주소' })
  @ToLowerCase()
  @IsEmail()
  override email!: string;
}
