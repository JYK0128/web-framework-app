import type { CreateOAuthIconPresignedUrlRequestDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.dto';

export class CreateOAuthIconPresignedUrlCommand {
  constructor(public readonly input: CreateOAuthIconPresignedUrlRequestDto) {}
}
