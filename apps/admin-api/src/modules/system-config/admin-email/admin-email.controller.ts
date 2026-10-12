import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { TestAdminEmailCommand } from './test-admin-email.command';
import { TestAdminEmailRequestDto } from './test-admin-email.request.dto';
import { TestAdminEmailResponseDto } from './test-admin-email.response.dto';

@ApiTags('system-configs')
@UserAuth()
@Controller('system-config')
export class SystemConfigAdminEmailController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('test-email')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(TestAdminEmailResponseDto)
  @ApiOperation({ operationId: 'SystemConfigController_testAdminEmail_v1', summary: '시스템 설정 관리자 이메일 테스트 전송' })
  testAdminEmail(@Body() input: TestAdminEmailRequestDto): Promise<TestAdminEmailResponseDto> {
    return this.commandBus.execute(new TestAdminEmailCommand(input));
  }
}
