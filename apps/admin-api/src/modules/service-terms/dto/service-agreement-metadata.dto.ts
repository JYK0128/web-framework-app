import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from '@pkg/shared/common';
import { IsOptional, ValidateBy } from 'class-validator';

import { BaseDto } from '#/common/dto/base.dto';

export const ServiceAgreementOptionsSchema = z.record(z.string(), z.boolean().nullable());

export class ServiceAgreementMetadataDto extends BaseDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'boolean', nullable: true }, nullable: true })
  @IsOptional()
  @ValidateBy({ name: 'serviceAgreementOptions', validator: { validate: (value: unknown) => ServiceAgreementOptionsSchema.safeParse(value).success } })
  options?: Record<string, boolean | null> | null;

  static fromMetadata(metadata: Record<string, unknown> | null): ServiceAgreementMetadataDto | null {
    if (!metadata || metadata.options === undefined || metadata.options === null) return null;
    return this.fromPlain({ options: ServiceAgreementOptionsSchema.parse(metadata.options) });
  }
}
