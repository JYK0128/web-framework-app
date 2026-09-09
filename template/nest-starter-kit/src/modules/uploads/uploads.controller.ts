import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { createFilePipe } from '#/common/pipes';

import { UploadOAuthIconResponseDto } from './dto/upload-o-auth-icon.response.dto';
import { OAUTH_ICON_MAX_SIZE } from './uploads.constants';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Permission('system:manage')
  @ApiBearerAuth()
  @Post('admin/oauth-icon')
  @ApiOperation({
    summary: 'OAuth 프로바이더 아이콘 업로드',
    description: 'PNG, JPEG, WebP 형식의 OAuth 프로바이더 아이콘을 업로드하고 공개 URL을 반환합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PNG, JPEG, WebP 이미지 (최대 2MB)',
        },
      },
    },
  })
  @SwaggerApiResponse(UploadOAuthIconResponseDto, 201)
  @UseInterceptors(FileInterceptor('file'))
  async uploadOAuthIcon(
    @UploadedFile(createFilePipe({
      maxSize: OAUTH_ICON_MAX_SIZE,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    })) file: Express.Multer.File,
  ): Promise<UploadOAuthIconResponseDto> {
    return this.uploadsService.saveOAuthIcon(file);
  }
}
