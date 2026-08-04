import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';

import { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, _context: ExecutionContext): CurrentUserResponseDto => {
    const user = ClsServiceManager.getClsService().get('user');
    if (!user) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required' });

    return new CurrentUserResponseDto(user);
  },
);
