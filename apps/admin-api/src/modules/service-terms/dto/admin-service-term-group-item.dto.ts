import { ApiProperty } from '@nestjs/swagger';
export class AdminServiceTermGroupItemDto { @ApiProperty() id!: string; @ApiProperty() code!: string; @ApiProperty() title!: string; @ApiProperty() isRequired!: boolean; @ApiProperty() sortOrder!: number; @ApiProperty({ format: 'date-time' }) createdAt!: Date; @ApiProperty({ format: 'date-time' }) updatedAt!: Date; }
