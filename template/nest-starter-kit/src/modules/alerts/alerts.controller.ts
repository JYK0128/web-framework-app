import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { DeleteAlertCommand, MarkAlertReadCommand, MarkAllAlertsReadCommand } from './commands';
import { AlertFeedResponseDto, DeleteAlertResponseDto, GetAlertsRequestDto, MarkAlertReadResponseDto, MarkAllAlertsReadResponseDto } from './dto';
import { GetMyAlertsQuery } from './queries';

@ApiTags('alerts')
@Controller('alerts')
@Bypass(BypassPolicy.PERMISSION)
export class AlertsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @SwaggerApiResponse(AlertFeedResponseDto)
  async getMyAlerts(
    @CurrentUser() currentUser: AuthPrincipal,
    @Query() query: GetAlertsRequestDto,
  ): Promise<AlertFeedResponseDto> {
    return this.queryBus.execute(new GetMyAlertsQuery({ userId: currentUser.id, limit: query.limit }));
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkAlertReadResponseDto)
  async markAlertRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<MarkAlertReadResponseDto> {
    return this.commandBus.execute(new MarkAlertReadCommand({ alertId: id, userId: currentUser.id }));
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(MarkAllAlertsReadResponseDto)
  async markAllAlertsRead(
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<MarkAllAlertsReadResponseDto> {
    return this.commandBus.execute(new MarkAllAlertsReadCommand({ userId: currentUser.id }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteAlertResponseDto)
  async deleteAlert(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteAlertResponseDto> {
    return this.commandBus.execute(new DeleteAlertCommand({ alertId: id, userId: currentUser.id }));
  }
}
