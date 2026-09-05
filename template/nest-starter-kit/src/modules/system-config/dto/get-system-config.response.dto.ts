import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

import { OperatingHoursDto } from './operating-hours.dto';
import { OperatingStatusDto } from './operating-status.dto';

export class GetSystemConfigResponseDto {
  @ApiProperty({ example: false, description: '시스템 점검 모드 활성화 여부' })
  @IsBoolean()
  maintenanceMode!: boolean;

  @ApiProperty({ example: '시스템 점검 중입니다.', description: '점검 모드 시 사용자 안내 문구' })
  @IsString()
  maintenanceMessage!: string;

  @ApiProperty({ example: true, description: '신규 사용자 회원가입 허용 여부' })
  @IsBoolean()
  allowRegistration!: boolean;

  @ApiProperty({ type: OperatingHoursDto, description: '1:1 고객문의 업무 운영 시간 및 휴일/메시지 설정' })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours!: OperatingHoursDto;

  @ApiProperty({ type: OperatingStatusDto, description: '실시간 고객센터 운영 상태 (서버 KST 기준)' })
  @ValidateNested()
  @Type(() => OperatingStatusDto)
  operatingStatus!: OperatingStatusDto;
}
