import type { CreateOAuthIconPresignedUrlRequestDto } from '#/modules/system-config/dto/create-oauth-icon-presigned-url.dto';

export class CreateOAuthIconPresignedUrlCommand {
  constructor(public readonly input: CreateOAuthIconPresignedUrlRequestDto) {}
}
