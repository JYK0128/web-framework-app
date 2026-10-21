import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MachineAuth, SwaggerApiResponse } from '@pkg/server-core/http/decorators';

import { CreateSupportMessageCommand } from '~/modules/support/message/create-support-message.command';
import { CreateSupportMessageRequestDto } from '~/modules/support/message/create-support-message.request.dto';
import { CreateSupportMessageResponseDto } from '~/modules/support/message/create-support-message.response.dto';
import { GetSupportMessagesQuery } from '~/modules/support/message/get-support-messages.query';
import { GetSupportMessagesRequestDto } from '~/modules/support/message/get-support-messages.request.dto';
import { GetSupportMessagesResponseDto } from '~/modules/support/message/get-support-messages.response.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/support')
export class SupportInternalMessagesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @ApiOperation({ summary: undefined, operationId: 'SupportInternalController_listMessages_v1' })
  @Get('rooms/:roomId/messages') @SwaggerApiResponse(GetSupportMessagesResponseDto)
  async listMessages(@Param('roomId') roomId: string): Promise<GetSupportMessagesResponseDto> {
    const request = GetSupportMessagesRequestDto.parse({ roomId }).validate();
    return this.queryBus.execute(new GetSupportMessagesQuery(request));
  }

  @ApiOperation({ summary: undefined, operationId: 'SupportInternalController_createMessage_v1' })
  @Post('rooms/:roomId/messages') @SwaggerApiResponse(CreateSupportMessageResponseDto)
  createMessage(@Param('roomId') roomId: string, @Body() input: CreateSupportMessageRequestDto): Promise<CreateSupportMessageResponseDto> { return this.commandBus.execute(new CreateSupportMessageCommand({ roomId, dto: input })); }
}
