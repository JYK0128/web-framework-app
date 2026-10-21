import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class MembershipPermissionItemDto extends BaseDto { @ApiProperty() code!: string; @ApiProperty() resource!: string; @ApiProperty() action!: string; @ApiProperty() label!: string; @ApiPropertyOptional() description?: string; }
