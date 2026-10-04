import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SortDirection } from '#/common/interfaces';
import { SupportTicketPriority, SupportTicketStatus } from '#/entities/support/support-ticket.entity';

import { CreateSupportTicketCommand, DeleteAdminSupportTicketCommand, DeleteSupportTicketCommand, UpdateAdminSupportTicketCommand, UpdateSupportTicketCommand } from './commands';
import { CreateSupportTicketRequestDto, CreateSupportTicketResponseDto, DeleteAdminSupportTicketResponseDto, DeleteSupportTicketResponseDto, GetAdminSupportTicketResponseDto, GetAdminSupportTicketsRequestDto, GetAdminSupportTicketsResponseDto, GetSupportTicketResponseDto, GetSupportTicketsRequestDto, GetSupportTicketsResponseDto, UpdateAdminSupportTicketRequestDto, UpdateAdminSupportTicketResponseDto, UpdateSupportTicketRequestDto, UpdateSupportTicketResponseDto } from './dto';
import { SUPPORT_TICKET_SORT } from './dto/get-support-tickets.request.dto';
import { GetAdminSupportTicketQuery, GetAdminSupportTicketsQuery, GetSupportTicketQuery, GetSupportTicketsQuery } from './queries';

@ApiTags('support')
@Controller('support/tickets')
export class SupportController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('support:manage', 'support:read')
  @Get('admin')
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'integer', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'integer', maximum: 100 })
  @ApiQuery({ name: 'sort', required: false, isArray: true, enum: SUPPORT_TICKET_SORT })
  @ApiQuery({ name: 'direction', required: false, isArray: true, enum: SortDirection })
  @ApiQuery({ name: 'status', required: false, enum: SupportTicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: SupportTicketPriority })
  @ApiQuery({ name: 'category', required: false, type: 'string' })
  @SwaggerApiResponse(GetAdminSupportTicketsResponseDto)
  async getAdminSupportTickets(@Query() query: GetAdminSupportTicketsRequestDto): Promise<GetAdminSupportTicketsResponseDto> {
    return this.queryBus.execute(new GetAdminSupportTicketsQuery({ query }));
  }

  @Permission('support:manage', 'support:read')
  @Get('admin/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @SwaggerApiResponse(GetAdminSupportTicketResponseDto)
  async getAdminSupportTicket(@Param('id') id: string): Promise<GetAdminSupportTicketResponseDto> {
    return this.queryBus.execute(new GetAdminSupportTicketQuery({ ticketId: id }));
  }

  @Permission('support:manage', 'support:update')
  @Patch('admin/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateAdminSupportTicketRequestDto })
  @SwaggerApiResponse(UpdateAdminSupportTicketResponseDto)
  async updateAdminSupportTicket(
    @Param('id') id: string,
    @Body() input: UpdateAdminSupportTicketRequestDto,
  ): Promise<UpdateAdminSupportTicketResponseDto> {
    return this.commandBus.execute(new UpdateAdminSupportTicketCommand({ ticketId: id, input }));
  }

  @Permission('support:manage', 'support:delete')
  @Delete('admin/:id')
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteAdminSupportTicketResponseDto)
  async deleteAdminSupportTicket(@Param('id') id: string): Promise<DeleteAdminSupportTicketResponseDto> {
    return this.commandBus.execute(new DeleteAdminSupportTicketCommand({ ticketId: id }));
  }

  @Permission('support:read')
  @Get()
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'integer', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'integer', maximum: 100 })
  @ApiQuery({ name: 'sort', required: false, isArray: true, enum: SUPPORT_TICKET_SORT })
  @ApiQuery({ name: 'direction', required: false, isArray: true, enum: SortDirection })
  @ApiQuery({ name: 'status', required: false, enum: SupportTicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: SupportTicketPriority })
  @ApiQuery({ name: 'category', required: false, type: 'string' })
  @SwaggerApiResponse(GetSupportTicketsResponseDto)
  async getSupportTickets(@Query() query: GetSupportTicketsRequestDto): Promise<GetSupportTicketsResponseDto> {
    return this.queryBus.execute(new GetSupportTicketsQuery({ query }));
  }

  @Permission('support:create')
  @Post()
  @ApiBody({ type: CreateSupportTicketRequestDto })
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateSupportTicketResponseDto, HttpStatus.CREATED)
  async createSupportTicket(@Body() input: CreateSupportTicketRequestDto): Promise<CreateSupportTicketResponseDto> {
    return this.commandBus.execute(new CreateSupportTicketCommand(input));
  }

  @Permission('support:read')
  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @SwaggerApiResponse(GetSupportTicketResponseDto)
  async getSupportTicket(@Param('id') id: string): Promise<GetSupportTicketResponseDto> {
    return this.queryBus.execute(new GetSupportTicketQuery({ ticketId: id }));
  }

  @Permission('support:update')
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateSupportTicketRequestDto })
  @SwaggerApiResponse(UpdateSupportTicketResponseDto)
  async updateSupportTicket(
    @Param('id') id: string,
    @Body() input: UpdateSupportTicketRequestDto,
  ): Promise<UpdateSupportTicketResponseDto> {
    return this.commandBus.execute(new UpdateSupportTicketCommand({ ticketId: id, input }));
  }

  @Permission('support:delete')
  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteSupportTicketResponseDto)
  async deleteSupportTicket(@Param('id') id: string): Promise<DeleteSupportTicketResponseDto> {
    return this.commandBus.execute(new DeleteSupportTicketCommand({ ticketId: id }));
  }
}
