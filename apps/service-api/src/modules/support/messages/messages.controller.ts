import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { CreateOwnSupportMessageCommand } from '#/modules/support/messages/create-own-support-message.command';
import { CreateSupportMessageRequestDto } from '#/modules/support/messages/create-support-message.request.dto';
import { CreateSupportMessageResponseDto } from '#/modules/support/messages/create-support-message.response.dto';
import { GetOwnSupportMessagesQuery } from '#/modules/support/messages/get-own-support-messages.query';
import { GetSupportMessagesRequestDto } from '#/modules/support/messages/get-support-messages.request.dto';
import { GetSupportMessagesResponseDto } from '#/modules/support/messages/get-support-messages.response.dto';

@ApiTags('support')
@UserAuth()
@Controller('support')
export class SupportMessagesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportController_listMessages_v1' })
  @Get('rooms/:roomId/messages') @SwaggerApiResponse(GetSupportMessagesResponseDto)
  async listMessages(@Param('roomId') roomId: string): Promise<GetSupportMessagesResponseDto> {
    const request = GetSupportMessagesRequestDto.parse({ roomId }).validate();
    return this.queryBus.execute(new GetOwnSupportMessagesQuery(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportController_createMessage_v1' })
  @Post('rooms/:roomId/messages') @SwaggerApiResponse(CreateSupportMessageResponseDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto): Promise<CreateSupportMessageResponseDto> { return this.commandBus.execute(new CreateOwnSupportMessageCommand({ roomId, dto: input })); }
}
