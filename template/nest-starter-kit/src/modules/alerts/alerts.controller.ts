import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { DeleteAlertCommand, MarkAlertReadCommand, MarkAllAlertsReadCommand } from './commands';
import { AlertFeedResponseDto } from './dto/alert-feed-response.dto';
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
    @Query('limit') limit?: number,
  ): Promise<AlertFeedResponseDto> {
    return this.queryBus.execute(new GetMyAlertsQuery(currentUser.id, limit ? Number(limit) : 50));
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAlertRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<void> {
    await this.commandBus.execute(new MarkAlertReadCommand(id, currentUser.id));
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAlertsRead(
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<void> {
    await this.commandBus.execute(new MarkAllAlertsReadCommand(currentUser.id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlert(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteAlertCommand(id, currentUser.id));
  }
}
