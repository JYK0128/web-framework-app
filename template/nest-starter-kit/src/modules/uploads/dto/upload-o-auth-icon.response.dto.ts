import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UploadOAuthIconResponseDto {
  @ApiProperty({ example: '/api/v1/uploads/oauth-icons/2e5c4f74-0f93-4db5-8d73-6a2a9e8dfb28.png' })
  @IsString()
  url!: string;
}
