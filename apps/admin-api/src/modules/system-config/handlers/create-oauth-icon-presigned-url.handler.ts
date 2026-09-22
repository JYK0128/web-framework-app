import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Upload, UploadStatus } from '#/entities/uploads/upload.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { StorageService } from '#/infra/storage/storage.service';
import { CreateOAuthIconPresignedUrlCommand } from '#/modules/system-config/commands/create-oauth-icon-presigned-url.command';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-config/dto/create-oauth-icon-presigned-url.dto';
import { OAUTH_ICON_SUBDIR } from '#/modules/system-config/system-config.constants';

@Injectable()
@CommandHandler(CreateOAuthIconPresignedUrlCommand)
export class CreateOAuthIconPresignedUrlHandler implements ICommandHandler<CreateOAuthIconPresignedUrlCommand, CreateOAuthIconPresignedUrlResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly storageService: StorageService) {}

  async execute(command: CreateOAuthIconPresignedUrlCommand): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const input = command.input;
    const extension = (/\.([a-zA-Z0-9]+)$/.exec(input.filename)?.[1] ?? 'png').toLowerCase();
    const filename = `${randomUUID()}.${extension}`;
    const presigned = await this.storageService.getPresignedUploadUrl(OAUTH_ICON_SUBDIR, filename, input.contentType, 300);
    const upload = this.em.create(Upload, {
      originalName: input.filename,
      storedName: filename,
      mimeType: input.contentType,
      size: input.fileSize,
      subDir: OAUTH_ICON_SUBDIR,
      url: presigned.fileUrl,
      status: UploadStatus.PENDING,
    });
    await this.em.flush();
    return { ...presigned, uploadId: upload.id };
  }
}
