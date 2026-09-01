import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsUrl, Max, Min, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

export class AuthPolicyValueDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  allowRegistration!: boolean;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  loginFailureThreshold!: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  loginLockDurationMinutes!: number;

  @ApiProperty({ example: 90 })
  @IsInt()
  @Min(0)
  passwordExpirationDays!: number;
}

export class SlackNotificationValueDto {
  @ApiProperty({ example: 'https://hooks.slack.com/services/...' })
  @IsUrl({ require_tld: false })
  webhookUrl!: string;
}

export class InquiryPolicyValueDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(120)
  unansweredThresholdMinutes!: number;

  @ApiProperty({ example: 72 })
  @IsInt()
  @Min(1)
  @Max(720)
  autoCloseHours!: number;
}

export class UpdateSecurityTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: AuthPolicyValueDto })
  @ValidateNested()
  @Type(() => AuthPolicyValueDto)
  authPolicy!: AuthPolicyValueDto;

  @ApiProperty({ type: SlackNotificationValueDto })
  @ValidateNested()
  @Type(() => SlackNotificationValueDto)
  slackNotification!: SlackNotificationValueDto;

  @ApiProperty({ type: InquiryPolicyValueDto })
  @ValidateNested()
  @Type(() => InquiryPolicyValueDto)
  inquiryPolicy!: InquiryPolicyValueDto;
}
