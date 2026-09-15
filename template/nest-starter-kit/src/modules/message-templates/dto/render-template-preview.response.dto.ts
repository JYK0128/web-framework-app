import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenderTemplatePreviewResponseDto {
  @ApiPropertyOptional({ type: 'string', nullable: true })
  title: string | null = null;

  @ApiProperty({ type: 'string' })
  body!: string;

  @ApiProperty({ type: 'string' })
  channel!: string;
}
