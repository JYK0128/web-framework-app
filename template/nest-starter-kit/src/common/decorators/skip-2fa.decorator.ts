import { SetMetadata } from '@nestjs/common';

import { SKIP_2FA_KEY } from '#/modules/auth/two-factor-auth.guard';

export const Skip2FA = () => SetMetadata(SKIP_2FA_KEY, true);
