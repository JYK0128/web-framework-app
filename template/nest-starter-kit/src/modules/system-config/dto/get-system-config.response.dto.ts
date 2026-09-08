import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { OperatingHoursDto } from './operating-hours.dto';
import { OperatingStatusDto } from './operating-status.dto';

export class PublicOAuthProvidersDto {
  @ApiProperty({ example: false, description: 'Google 소셜 로그인 활성화 여부' })
  @IsBoolean()
  google!: boolean;

  @ApiProperty({ example: false, description: 'Kakao 소셜 로그인 활성화 여부' })
  @IsBoolean()
  kakao!: boolean;

  @ApiProperty({ example: false, description: 'Naver 소셜 로그인 활성화 여부' })
  @IsBoolean()
  naver!: boolean;
}

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

  @ApiProperty({ example: true, description: '로컬(이메일/비밀번호) 신규 회원가입 허용 여부' })
  @IsBoolean()
  allowPasswordRegistration!: boolean;

  @ApiProperty({ type: OperatingHoursDto, description: '1:1 고객문의 업무 운영 시간 및 휴일/메시지 설정' })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  operatingHours!: OperatingHoursDto;

  @ApiProperty({ type: OperatingStatusDto, description: '실시간 고객센터 운영 상태 (서버 KST 기준)' })
  @ValidateNested()
  @Type(() => OperatingStatusDto)
  operatingStatus!: OperatingStatusDto;

  @ApiProperty({ type: PublicOAuthProvidersDto, description: '소셜 로그인 제공자별 활성화 여부' })
  @ValidateNested()
  @Type(() => PublicOAuthProvidersDto)
  oauth!: PublicOAuthProvidersDto;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: '등록된 추가 공개 설정 맵',
  })
  @IsOptional()
  configs?: Record<string, unknown>;
}
