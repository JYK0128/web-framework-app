import { ApiProperty } from '@nestjs/swagger';

export class ServiceTermGroupItemDto { @ApiProperty() id!: string; @ApiProperty() title!: string; @ApiProperty() isRequired!: boolean; @ApiProperty() sortOrder!: number; @ApiProperty({ format: 'date-time' }) createdAt!: Date; @ApiProperty({ format: 'date-time' }) updatedAt!: Date; }
