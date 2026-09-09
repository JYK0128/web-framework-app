import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { OAUTH_ICON_UPLOAD_DIR, OAUTH_ICON_UPLOAD_URL_PREFIX } from './uploads.constants';

type SupportedImage = {
  extension: 'jpg' | 'png' | 'webp'
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

@Injectable()
export class UploadsService {
  async saveOAuthIcon(file: Express.Multer.File): Promise<{ url: string }> {
    const image = this.detectImage(file);
    if (!image || image.mimeType !== file.mimetype) {
      throw new ApplicationError({
        code: 'FILE_VALIDATION_ERROR',
        status: 400,
      });
    }

    await mkdir(OAUTH_ICON_UPLOAD_DIR, { recursive: true });

    const filename = `${randomUUID()}.${image.extension}`;
    await writeFile(join(OAUTH_ICON_UPLOAD_DIR, filename), file.buffer, {
      flag: 'wx',
      mode: 0o644,
    });

    return { url: `${OAUTH_ICON_UPLOAD_URL_PREFIX}/${filename}` };
  }

  private detectImage(file: Express.Multer.File): SupportedImage | undefined {
    const buffer = file?.buffer;
    if (!buffer || buffer.length === 0) return undefined;

    if (buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return { extension: 'png', mimeType: 'image/png' };
    }

    if (buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }

    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { extension: 'webp', mimeType: 'image/webp' };
    }

    return undefined;
  }
}
