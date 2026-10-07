import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { type User } from '#/entities/auth/user.entity';

import { CustomerItemDto } from './customer-item.dto';

@ApiSchema({ name: 'CustomerDetailResponse' })
export class CustomerDetailResponseDto extends CustomerItemDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  memo?: string | null;

  static override from(user: User): CustomerDetailResponseDto {
    return this.fromPlain({
      ...CustomerItemDto.from(user),
      memo: typeof user.metadata?.memo === 'string' ? user.metadata.memo : null,
    });
  }
}
