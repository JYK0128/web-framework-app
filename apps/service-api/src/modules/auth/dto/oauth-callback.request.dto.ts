import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'OAuthCallbackRequest' })
export class OAuthCallbackRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state!: string;
}
