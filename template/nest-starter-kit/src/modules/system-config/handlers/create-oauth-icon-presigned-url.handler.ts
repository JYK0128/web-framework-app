import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { Upload, UploadStatus } from '#/entities/uploads/upload.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { StorageService } from '#/infra/storage';
import { CreateOAuthIconPresignedUrlCommand } from '#/modules/system-config/commands/create-oauth-icon-presigned-url.command';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-config/dto';
import { OAUTH_ICON_SUBDIR } from '#/modules/system-config/system-config.constants';

@Injectable()
@CommandHandler(CreateOAuthIconPresignedUrlCommand)
export class CreateOAuthIconPresignedUrlHandler
implements ICommandHandler<CreateOAuthIconPresignedUrlCommand, CreateOAuthIconPresignedUrlResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: CreateOAuthIconPresignedUrlCommand): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const { dto } = { dto: command.input };
    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(dto.filename);
    const extension = extMatch ? extMatch[1].toLowerCase() : 'png';
    const filename = `${randomUUID()}.${extension}`;

    const presigned = await this.storageService.getPresignedUploadUrl(
      OAUTH_ICON_SUBDIR,
      filename,
      dto.contentType,
      300,
    );

    const upload = this.em.create(Upload, {
      originalName: dto.filename,
      storedName: filename,
      mimeType: dto.contentType,
      size: dto.fileSize,
      subDir: OAUTH_ICON_SUBDIR,
      url: presigned.fileUrl,
      status: UploadStatus.PENDING,
      uploaderId: this.sessionContext.user?.id ?? null,
    });
    await this.em.flush();

    return {
      uploadUrl: presigned.uploadUrl,
      fileUrl: presigned.fileUrl,
      uploadId: upload.id,
      expiresInSeconds: presigned.expiresInSeconds,
    };
  }
}
