import { ApiPropertyOptional } from '@nestjs/swagger';

import { type User } from '~/core/database/entities/auth';
import { CustomerItemDto } from '~/modules/customer/profile/customer-item.dto';

export class GetCustomerResponseDto extends CustomerItemDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  memo?: string | null;

  static override parseEntity(user: User): GetCustomerResponseDto {
    return this.parse({
      ...CustomerItemDto.parseEntity(user),
      memo: typeof user.metadata?.memo === 'string' ? user.metadata.memo : null,
    });
  }
}
