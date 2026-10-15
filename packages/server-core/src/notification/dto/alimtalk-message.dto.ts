import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateBy, ValidateNested } from 'class-validator';

export class AlimtalkButtonDto {
  @ApiProperty({ enum: ['WL', 'AL', 'DS', 'BK', 'MD', 'AC'] })
  @IsIn(['WL', 'AL', 'DS', 'BK', 'MD', 'AC'])
  type!: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'AC';

  @ApiProperty({ minLength: 1, maxLength: 28 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(28)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkMo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkPc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schemeIos?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schemeAndroid?: string;
}

export class AlimtalkMessageDto {
  @ApiProperty({ minLength: 1, description: '대행사에 등록된 승인 템플릿 코드. SOLAPI는 templateId.' })
  @IsString()
  @IsNotEmpty()
  templateCode!: string;

  @ApiProperty({ minLength: 1, description: '승인된 템플릿 원문. #{변수명} 치환 지원.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: '알리고 발송 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '알리고에 등록된 발신번호' })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiPropertyOptional({ description: 'SOLAPI 채널 pfId. 발신 프로필 키 대신 지정 가능.' })
  @IsOptional()
  @IsString()
  pfId?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' }, description: '변수명: 치환값. 예: {"이름":"홍길동"}' })
  @IsOptional()
  @IsObject()
  @ValidateBy({ name: 'stringVariables', validator: { validate: (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every((item) => typeof item === 'string'), defaultMessage: () => 'variables 값은 모두 문자열이어야 합니다.' } })
  variables?: Record<string, string>;

  @ApiPropertyOptional({ type: [AlimtalkButtonDto], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AlimtalkButtonDto)
  buttons?: AlimtalkButtonDto[];
}
