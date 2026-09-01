import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { CreateMessageTemplateCommand, DeleteMessageTemplateCommand, RenderTemplatePreviewCommand, TestSendTemplateCommand, UpdateMessageTemplateCommand } from '#/modules/message-templates/commands';
import { CreateMessageTemplateRequestDto, CreateMessageTemplateResponseDto, DeleteMessageTemplateResponseDto, GetMessageTemplatesRequestDto, GetMessageTemplatesResponseDto, MessageTemplateItemDto, RenderPreviewRequestDto, RenderPreviewResponseDto, TestSendTemplateRequestDto, TestSendTemplateResponseDto, UpdateMessageTemplateRequestDto, UpdateMessageTemplateResponseDto } from '#/modules/message-templates/dto';
import { GetMessageTemplateByIdQuery, GetMessageTemplatesQuery } from '#/modules/message-templates/queries';

@ApiTags('message-templates')
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Permission('template:manage', 'template:read')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: '메시지 템플릿 목록 조회',
    description: '채널, 언어, 검색어로 필터링된 메시지 템플릿 목록을 조회합니다.',
  })
  @SwaggerApiResponse(GetMessageTemplatesResponseDto)
  async getMessageTemplates(
    @Query() query: GetMessageTemplatesRequestDto,
  ): Promise<GetMessageTemplatesResponseDto> {
    return this.queryBus.execute(new GetMessageTemplatesQuery(query));
  }

  @Permission('template:manage', 'template:read')
  @ApiBearerAuth()
  @Get(':id')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 상세 조회',
    description: 'ID로 단일 메시지 템플릿 상세 정보를 조회합니다.',
  })
  @SwaggerApiResponse(MessageTemplateItemDto)
  async getMessageTemplateById(
    @Param('id') id: string,
  ): Promise<MessageTemplateItemDto> {
    return this.queryBus.execute(new GetMessageTemplateByIdQuery({ id }));
  }

  @Permission('template:manage')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: '메시지 템플릿 생성',
    description: '새로운 메시지 템플릿을 등록합니다.',
  })
  @SwaggerApiResponse(CreateMessageTemplateResponseDto)
  async createMessageTemplate(
    @Body() input: CreateMessageTemplateRequestDto,
  ): Promise<CreateMessageTemplateResponseDto> {
    return this.commandBus.execute(
      new CreateMessageTemplateCommand({ input }),
    );
  }

  @Permission('template:manage')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 수정',
    description: '메시지 템플릿 정보를 수정합니다.',
  })
  @SwaggerApiResponse(UpdateMessageTemplateResponseDto)
  async updateMessageTemplate(
    @Param('id') id: string,
    @Body() input: UpdateMessageTemplateRequestDto,
  ): Promise<UpdateMessageTemplateResponseDto> {
    return this.commandBus.execute(
      new UpdateMessageTemplateCommand({ id, input }),
    );
  }

  @Permission('template:manage')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 삭제',
    description: '템플릿을 삭제(Soft Delete)합니다.',
  })
  @SwaggerApiResponse(DeleteMessageTemplateResponseDto)
  async deleteMessageTemplate(
    @Param('id') id: string,
    @CurrentUser() adminUser: AuthPrincipal,
  ): Promise<DeleteMessageTemplateResponseDto> {
    return this.commandBus.execute(
      new DeleteMessageTemplateCommand({ id, deletedBy: adminUser?.id }),
    );
  }

  @Permission('template:manage', 'template:read')
  @ApiBearerAuth()
  @Post(':id/preview')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 미리보기 렌더링',
    description: '샘플 변수를 치환하여 렌더링된 제목과 본문 미리보기를 반환합니다.',
  })
  @SwaggerApiResponse(RenderPreviewResponseDto)
  async renderPreview(
    @Param('id') id: string,
    @Body() input: RenderPreviewRequestDto,
  ): Promise<RenderPreviewResponseDto> {
    return this.commandBus.execute(
      new RenderTemplatePreviewCommand({ id, input }),
    );
  }

  @Permission('template:manage')
  @ApiBearerAuth()
  @Post(':id/test-send')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 테스트 발송',
    description: '관리자 이메일, 슬랙 또는 인앱 알림으로 실제 테스트 발송을 수행합니다.',
  })
  @SwaggerApiResponse(TestSendTemplateResponseDto)
  async testSend(
    @Param('id') id: string,
    @Body() input: TestSendTemplateRequestDto,
    @CurrentUser() adminUser: AuthPrincipal,
  ): Promise<TestSendTemplateResponseDto> {
    return this.commandBus.execute(
      new TestSendTemplateCommand({
        id,
        input,
        adminUserId: adminUser.id,
      }),
    );
  }
}
