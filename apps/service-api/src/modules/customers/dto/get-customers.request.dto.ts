import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'GetCustomersRequest' })
export class GetCustomersRequestDto extends PageRequestDto<User> {
  @ApiPropertyOptional({ description: '고객 이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  override search?: string;

  override get searchFields(): (keyof User)[] {
    return ['name', 'email'];
  }
}
