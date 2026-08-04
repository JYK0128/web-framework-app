import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { EntityType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'CurrentUserResponse' })
export class CurrentUserResponseDto extends EntityType(User) {
  constructor(user: User) {
    super();
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.isAnonymous = user.isAnonymous;
    this.image = user.image;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  @ApiProperty({ format: 'uuid' })
  override id!: string;

  @ApiProperty({ maxLength: 120 })
  override name!: string;

  @ApiProperty({ format: 'email' })
  override email!: string;

  @ApiProperty()
  override emailVerified!: boolean;

  @ApiProperty()
  override isAnonymous!: boolean;

  @ApiProperty({ type: String, nullable: true, required: false })
  override image!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  override updatedAt!: Date;
}
