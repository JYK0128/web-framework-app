import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PublicOperatingLunchBreakDto {
  @ApiProperty({ example: false })
  enabled!: boolean;

  @ApiProperty({ example: '12:00' })
  start!: string;

  @ApiProperty({ example: '13:00' })
  end!: string;
}

export class PublicOperatingHoursDto {
  @ApiProperty({ example: '09:00' })
  start!: string;

  @ApiProperty({ example: '18:00' })
  end!: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3, 4, 5] })
  openDays!: number[];

  @ApiProperty({ type: PublicOperatingLunchBreakDto })
  @Type(() => PublicOperatingLunchBreakDto)
  lunchBreak!: PublicOperatingLunchBreakDto;
}

export class PublicOperatingHolidayDto {
  @ApiProperty({ example: '2026-01-01' })
  date!: string;
}

export class PublicOperatingMessagesDto {
  @ApiProperty()
  lunch!: string;

  @ApiProperty()
  offHours!: string;

  @ApiProperty()
  holiday!: string;
}

export class PublicOperationConfigDto {
  @ApiProperty({ type: PublicOperatingHoursDto })
  @Type(() => PublicOperatingHoursDto)
  hours!: PublicOperatingHoursDto;

  @ApiProperty({ type: [PublicOperatingHolidayDto] })
  @Type(() => PublicOperatingHolidayDto)
  holidays!: PublicOperatingHolidayDto[];

  @ApiProperty({ type: PublicOperatingMessagesDto })
  @Type(() => PublicOperatingMessagesDto)
  messages!: PublicOperatingMessagesDto;
}

export class PublicTemporaryMaintenanceDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: String, nullable: true })
  startAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  endAt!: string | null;
}

export class PublicRecurringMaintenanceDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: [Number], example: [4] })
  daysOfWeek!: number[];

  @ApiProperty({ example: '02:00' })
  startTime!: string;

  @ApiProperty({ example: '04:00' })
  endTime!: string;
}

export class PublicMaintenanceConfigDto {
  @ApiProperty({ type: PublicTemporaryMaintenanceDto })
  @Type(() => PublicTemporaryMaintenanceDto)
  temporary!: PublicTemporaryMaintenanceDto;

  @ApiProperty({ type: PublicRecurringMaintenanceDto })
  @Type(() => PublicRecurringMaintenanceDto)
  recurring!: PublicRecurringMaintenanceDto;
}

export class PublicSystemConfigsResponseDto {
  @ApiProperty({ type: PublicOperationConfigDto })
  @Type(() => PublicOperationConfigDto)
  operation!: PublicOperationConfigDto;

  @ApiProperty({ type: PublicMaintenanceConfigDto })
  @Type(() => PublicMaintenanceConfigDto)
  maintenance!: PublicMaintenanceConfigDto;
}
