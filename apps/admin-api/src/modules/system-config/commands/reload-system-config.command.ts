import { Command } from '@nestjs/cqrs';

import type { ReloadSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';

export class ReloadSystemConfigCommand extends Command<ReloadSystemConfigResponseDto> {}
