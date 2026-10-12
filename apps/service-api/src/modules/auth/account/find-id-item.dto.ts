import { ApiProperty } from '@nestjs/swagger';
import { decrypt } from '@pkg/shared/server';

import { Profile } from '#/core/database/entities/auth';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

export class FindIdItemDto extends EntityDto(Profile) {
  @ApiProperty({ type: String })
  maskedEmail!: string;

  @ApiProperty({ type: String })
  provider!: string;

  static override parseEntity(profile: Profile, provider: string, encryptionKey: string): FindIdItemDto {
    const email = decrypt(profile.emailEncrypted, encryptionKey);
    const [name, domain] = email.split('@');
    return this.parse({ maskedEmail: `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`, provider });
  }
}
