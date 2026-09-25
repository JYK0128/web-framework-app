import { ApiProperty } from '@nestjs/swagger';

export class MaintenanceStatusResponseDto {
  @ApiProperty() active!: boolean;
  @ApiProperty() message!: string;
}
