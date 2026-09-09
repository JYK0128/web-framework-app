import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IsEqualTo } from '#/common/decorators/is-equal-to.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'ResetPasswordRequest' })
export class ResetPasswordRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', description: '챌린지 ID' })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: 'string', description: '검증 토큰' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ type: 'string', description: '새 비밀번호' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @ApiProperty({ type: 'string', description: '새 비밀번호 확인' })
  @IsString()
  @IsEqualTo('newPassword', { message: 'login.passwordMismatch' })
  confirmPassword!: string;
}
