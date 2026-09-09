import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ListResponseDto } from '#/common/interfaces';
import { MessageChannel } from '#/entities/templates/message-template.entity';

export class TemplateVariableMetadataDto {
  @ApiProperty({ type: 'string', description: '치환 변수 키워드 (예: appName)' })
  key!: string;

  @ApiProperty({ type: 'string', description: '변수 한글 라벨 (예: 서비스 명칭)' })
  label!: string;

  @ApiProperty({ type: 'string', description: '변수 상세 용도 설명' })
  description!: string;

  @ApiProperty({ type: 'boolean', description: '비즈니스 로직 상 필수 주입 여부' })
  required!: boolean;

  @ApiProperty({ type: 'string', description: '미리보기 및 테스트 발송에 사용할 샘플 값' })
  sampleValue!: string;
}

export class CatalogChannelTemplateDto {
  @ApiEnumOptional({ enum: MessageChannel, description: '지원 발송 채널 (EMAIL, SMS, ALIMTALK, SLACK, IN_APP)' })
  channel!: MessageChannel;

  @ApiPropertyOptional({ type: 'string', nullable: true, description: '채널 기본 권장 제목' })
  defaultTitle!: string | null;

  @ApiProperty({ type: 'string', description: '채널 기본 권장 본문' })
  defaultBody!: string;

  @ApiProperty({ type: 'integer', description: '채널 발송 우선순위 (Fallback 순서)' })
  priority!: number;
}

export class MessageTemplateCatalogItemDto {
  @ApiProperty({ type: 'string', description: '비즈니스 이벤트 고유 식별 코드' })
  code!: string;

  @ApiProperty({ type: 'string', description: '템플릿 기본 명칭' })
  name!: string;

  @ApiProperty({ type: 'string', description: '템플릿 용도 및 발송 트리거 설명' })
  description!: string;

  @ApiProperty({ type: 'boolean', description: '시스템 필수 템플릿 여부' })
  isSystem!: boolean;

  @ApiProperty({ type: () => [TemplateVariableMetadataDto], description: '지원하는 키워드(변수) 명세' })
  variables!: TemplateVariableMetadataDto[];

  @ApiProperty({ type: () => [CatalogChannelTemplateDto], description: '해당 시나리오에서 기본 지원하는 채널별 템플릿' })
  channels!: CatalogChannelTemplateDto[];
}

export class GetMessageTemplateCatalogResponseDto extends ListResponseDto<MessageTemplateCatalogItemDto> {
  @ApiProperty({ type: () => [MessageTemplateCatalogItemDto], description: '사전 정의된 시스템 메시지 템플릿 카탈로그 목록' })
  override items!: MessageTemplateCatalogItemDto[];

  @ApiProperty({ type: () => [TemplateVariableMetadataDto], description: '1계층: 전역 브랜드/회사 상수 (자동 주입)' })
  brandVariables!: TemplateVariableMetadataDto[];

  @ApiProperty({ type: () => [TemplateVariableMetadataDto], description: '2계층: 시스템 예약 런타임 변수 (자동 계산)' })
  systemVariables!: TemplateVariableMetadataDto[];
}
