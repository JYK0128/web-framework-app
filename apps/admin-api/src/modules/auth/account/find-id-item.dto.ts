import { ApiProperty } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { decrypt } from '@pkg/shared/server';

import { Profile } from '~/core/database/entities/auth';

export class FindIdItemDto extends EntityDto(Profile) {
  @ApiProperty() maskedEmail!: string;
  @ApiProperty() provider!: string;

  static override parseEntity(profile: Profile, provider: string, encryptionKey: string): FindIdItemDto {
    const email = decrypt(profile.emailEncrypted, encryptionKey);
    const [name, domain] = email.split('@');
    return this.parse({ maskedEmail: `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`, provider });
  }
}
