import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Public, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { SetServiceTermAgreementsCommand } from './commands';
import { GetServiceTermAgreementsResponseDto, GetServiceTermsRequestDto, ServiceTermDetailResponseDto, ServiceTermListResponseDto, SetServiceTermAgreementsRequestDto, SetServiceTermAgreementsResponseDto } from './dto';
import { GetServiceTermAgreementsQuery, GetServiceTermQuery, GetServiceTermsQuery } from './queries';

@ApiTags('service-terms')
@Controller('service-terms')
export class ServiceTermsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus, private readonly principalContext: PrincipalContext) {}

  @Public() @ApiOperation({ summary: '게시된 고객용 서비스 약관 목록 조회' }) @SwaggerApiResponse(ServiceTermListResponseDto) @Get()
  getTerms(@Query() query: GetServiceTermsRequestDto): Promise<ServiceTermListResponseDto> { return this.queryBus.execute(new GetServiceTermsQuery(query)); }

  @UserAuth() @ApiOperation({ summary: '현재 사용자의 서비스 약관 동의 상태 조회' }) @SwaggerApiResponse(GetServiceTermAgreementsResponseDto) @Get('agreements')
  getAgreements(): Promise<GetServiceTermAgreementsResponseDto> { return this.queryBus.execute(new GetServiceTermAgreementsQuery({ userId: this.principalContext.ensureUser().id })); }

  @UserAuth() @ApiOperation({ summary: '서비스 약관 동의 상태 저장' }) @HttpCode(HttpStatus.OK) @SwaggerApiResponse(SetServiceTermAgreementsResponseDto) @Post('agreements')
  setAgreements(@Body() dto: SetServiceTermAgreementsRequestDto): Promise<SetServiceTermAgreementsResponseDto> { return this.commandBus.execute(new SetServiceTermAgreementsCommand({ userId: this.principalContext.ensureUser().id, dto })); }

  @Public() @ApiOperation({ summary: '게시된 고객용 서비스 약관 상세 조회' }) @SwaggerApiResponse(ServiceTermDetailResponseDto) @Get(':termId')
  getTerm(@Param('termId') termId: string): Promise<ServiceTermDetailResponseDto> { return this.queryBus.execute(new GetServiceTermQuery({ termId })); }
}
