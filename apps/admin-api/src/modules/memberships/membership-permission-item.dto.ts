import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class MembershipPermissionItemDto extends BaseDto { @ApiProperty() code!: string; @ApiProperty() resource!: string; @ApiProperty() action!: string; @ApiProperty() label!: string; @ApiPropertyOptional() description?: string; }
