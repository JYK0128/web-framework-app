import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'LogoutResponse' })
export class LogoutResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, example: true, description: '로그아웃 성공 여부' })
  ok!: boolean;
}
