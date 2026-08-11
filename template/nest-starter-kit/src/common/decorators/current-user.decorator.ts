import { createParamDecorator, type ExecutionContext, HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import { ClsServiceManager } from 'nestjs-cls';

import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, _context: ExecutionContext): UserProfileResponseDto => {
    const user = ClsServiceManager.getClsService().get('user');
    if (!user) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    return new UserProfileResponseDto(user);
  },
);
