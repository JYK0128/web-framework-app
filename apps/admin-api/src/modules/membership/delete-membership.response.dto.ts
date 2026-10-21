import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';

export class DeleteMembershipResponseDto extends BaseDto { @ApiProperty() id!: string; @ApiProperty() deleted!: boolean; }
