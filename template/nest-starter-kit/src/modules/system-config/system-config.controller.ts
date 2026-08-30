import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { UpdateMaintenanceTabCommand } from '#/modules/system-config/commands/update-maintenance-tab.command';
import { UpdateMessagesTabCommand } from '#/modules/system-config/commands/update-messages-tab.command';
import { UpdateOperationsTabCommand } from '#/modules/system-config/commands/update-operations-tab.command';
import { UpdateSecurityTabCommand } from '#/modules/system-config/commands/update-security-tab.command';
import { GetAdminSystemConfigRequestDto, GetAdminSystemConfigResponseDto, GetHolidaysRequestDto, GetHolidaysResponseDto, GetSystemConfigRequestDto, GetSystemConfigResponseDto, UpdateMaintenanceTabRequestDto, UpdateMaintenanceTabResponseDto, UpdateMessagesTabRequestDto, UpdateMessagesTabResponseDto, UpdateOperationsTabRequestDto, UpdateOperationsTabResponseDto, UpdateSecurityTabRequestDto, UpdateSecurityTabResponseDto } from '#/modules/system-config/dto';
import { GetAdminSystemConfigQuery } from '#/modules/system-config/queries/get-admin-system-config.query';
import { GetHolidaysQuery } from '#/modules/system-config/queries/get-holidays.query';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';

@ApiTags('system-config')
@Controller('system-config')
export class SystemConfigController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '공개 앱 환경설정 조회',
    description: '점검 모드, 회원가입 허용 여부, 고객센터 운영시간 등 일반 사용자용 설정을 조회합니다.',
  })
  @SwaggerApiResponse(GetSystemConfigResponseDto)
  async getSystemConfig(
    @Query() query: GetSystemConfigRequestDto,
  ): Promise<GetSystemConfigResponseDto> {
    return this.queryBus.execute(new GetSystemConfigQuery({ query }));
  }

  @Permission('system:manage', 'system:read')
  @ApiBearerAuth()
  @Get('admin')
  @ApiOperation({
    summary: '관리자용 시스템 전체 설정 조회',
    description: '모든 시스템 설정 키-값 목록을 조회합니다. 관리자 권한이 필요합니다.',
  })
  @SwaggerApiResponse(GetAdminSystemConfigResponseDto)
  async getAdminSystemConfig(
    @Query() query: GetAdminSystemConfigRequestDto,
  ): Promise<GetAdminSystemConfigResponseDto> {
    return this.queryBus.execute(new GetAdminSystemConfigQuery({ query }));
  }

  @Permission('system:manage', 'system:read')
  @ApiBearerAuth()
  @Get('admin/holidays')
  @ApiOperation({
    summary: '공식 법정공휴일 목록 조회',
    description: '공공데이터포털 또는 공식 법정공휴일/대체공휴일 계산 엔진을 통해 대상 연도의 공휴일 목록을 조회합니다. (순수 조회 Query로 DB를 변경하지 않습니다)',
  })
  @SwaggerApiResponse(GetHolidaysResponseDto)
  async getHolidays(
    @Query() query: GetHolidaysRequestDto,
  ): Promise<GetHolidaysResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query }));
  }

  @Permission('system:manage')
  @ApiBearerAuth()
  @Patch('admin/operations')
  @ApiOperation({
    summary: '운영 탭 설정 수정',
    description: '운영시간과 공휴일 설정을 하나의 트랜잭션으로 수정합니다.',
  })
  @SwaggerApiResponse(UpdateOperationsTabResponseDto)
  async updateOperations(
    @Body() dto: UpdateOperationsTabRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UpdateOperationsTabResponseDto> {
    return this.commandBus.execute(
      new UpdateOperationsTabCommand(dto, user),
    );
  }

  @Permission('system:manage')
  @ApiBearerAuth()
  @Patch('admin/messages')
  @ApiOperation({ summary: '안내 메시지 탭 설정 수정' })
  @SwaggerApiResponse(UpdateMessagesTabResponseDto)
  async updateMessages(
    @Body() dto: UpdateMessagesTabRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UpdateMessagesTabResponseDto> {
    return this.commandBus.execute(new UpdateMessagesTabCommand(dto, user));
  }

  @Permission('system:manage')
  @ApiBearerAuth()
  @Patch('admin/maintenance')
  @ApiOperation({ summary: '점검 탭 설정 수정' })
  @SwaggerApiResponse(UpdateMaintenanceTabResponseDto)
  async updateMaintenance(
    @Body() dto: UpdateMaintenanceTabRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UpdateMaintenanceTabResponseDto> {
    return this.commandBus.execute(new UpdateMaintenanceTabCommand(dto, user));
  }

  @Permission('system:manage')
  @ApiBearerAuth()
  @Patch('admin/security')
  @ApiOperation({
    summary: '보안·알림 탭 설정 수정',
    description: '인증, Slack, 문의 정책을 하나의 트랜잭션으로 수정합니다.',
  })
  @SwaggerApiResponse(UpdateSecurityTabResponseDto)
  async updateSecurity(
    @Body() dto: UpdateSecurityTabRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<UpdateSecurityTabResponseDto> {
    return this.commandBus.execute(new UpdateSecurityTabCommand(dto, user));
  }
}
