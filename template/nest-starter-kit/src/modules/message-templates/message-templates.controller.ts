import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { RenderTemplatePreviewCommand, TestSendTemplateCommand, UpdateMessageTemplateCommand } from '#/modules/message-templates/commands';
import { GetMessageTemplatesRequestDto, GetMessageTemplatesResponseDto, MessageTemplateItemDto, RenderPreviewRequestDto, RenderPreviewResponseDto, TestSendTemplateRequestDto, TestSendTemplateResponseDto, UpdateMessageTemplateRequestDto, UpdateMessageTemplateResponseDto } from '#/modules/message-templates/dto';
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
  @Patch(':id')
  @ApiParam({ name: 'id', description: '템플릿 ID' })
  @ApiOperation({
    summary: '메시지 템플릿 수정',
    description: '템플릿의 제목, 본문, 활성화 여부를 수정합니다.',
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
