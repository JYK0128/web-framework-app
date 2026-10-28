import 'reflect-metadata';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Controller, Get, Module, Query, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QueryRequestDto } from '@pkg/server-core/http/dto/request';

class Item { title!: string; createdAt!: Date; }
const Search = QueryRequestDto(Item, { search: { fields: ['title'] } });
const FilterAndSearch = QueryRequestDto(Item, { filter: { createdAt: { type: 'date' } }, search: { fields: ['title'] } });
const Page = QueryRequestDto(Item, { sort: { fields: ['createdAt'], default: ['createdAt'] }, page: { defaultLimit: 10 } });
const Cursor = QueryRequestDto(Item, { sort: { fields: ['createdAt'], default: ['createdAt'] }, cursor: {} });
const Combined = QueryRequestDto(Item, {
  filter: { createdAt: { type: 'date' } },
  search: { fields: ['title'] },
  sort: { fields: ['createdAt'], default: ['createdAt'] },
  page: {},
});
class SearchRequest extends Search {}
class FilterAndSearchRequest extends FilterAndSearch {}
class PageRequest extends Page {}
@Controller('test')
class TestController {
  @Get('search') search(@Query() _query: SearchRequest) {}
  @Get('filter') filter(@Query() _query: FilterAndSearchRequest) {}
  @Get('page') page(@Query() _query: PageRequest) {}
}
@Module({ controllers: [TestController] })
class TestModule {}
const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const parse = <T>(metatype: new (...args: never[]) => T, value: object): Promise<T> => pipe.transform(value, { type: 'query', metatype }) as Promise<T>;

void test('search-only accepts search, excludes filters and produces a search condition', async () => {
  const dto = await parse(Search, { search: ' 축제 ' });
  assert.deepEqual(dto.toQuery(), { where: { $and: [{ $or: [{ title: { $like: '%축제%' } }] }] } });
  await assert.rejects(parse(Search, { filters: {} }));
});

void test('search and filter are combined and invalid filters fail', async () => {
  const dto = await parse(FilterAndSearch, { search: '축제', filters: { createdAt: { gte: '2026-01-01' } } });
  assert.deepEqual(dto.toQuery(), { where: { $and: [{ $and: [{ $and: [{ createdAt: { $gte: new Date('2026-01-01') } }] }] }, { $or: [{ title: { $like: '%축제%' } }] }] } });
  const invalid = await parse(FilterAndSearch, { filters: { title: { eq: 'test' } } });
  assert.throws(() => invalid.toQuery());
});

void test('page and cursor capabilities convert input and keep sort optional for pages', async () => {
  const dto = await parse(Page, { page: '2', limit: '5', sort: 'createdAt', direction: 'asc' });
  assert.deepEqual(dto.toQuery(), { where: {}, page: 2, limit: 5, orderBy: { createdAt: 'asc' } });
  await assert.rejects(parse(Page, { search: 'test' }));
  await assert.rejects(parse(Page, { sort: 'title' }));
  const plain = QueryRequestDto(Item, { page: {} });
  assert.deepEqual((await parse(plain, {})).toQuery(), { where: {}, page: 1, limit: 20 });
  assert.deepEqual((await parse(Cursor, { cursor: 'next', limit: '4' })).toQuery(), { where: {}, after: 'next', first: 4, orderBy: { createdAt: 'desc' } });
  assert.throws(() => QueryRequestDto(Item, { cursor: {} }));
  assert.throws(() => QueryRequestDto(Item, { page: {}, cursor: {}, sort: { fields: ['createdAt'], default: ['createdAt'] } }));
});

void test('combined query retains search, filter, sort, and pagination', async () => {
  const dto = await parse(Combined, { search: '축제', filters: { createdAt: { gte: '2026-01-01' } }, page: '2', limit: '5', direction: 'asc' });
  const { where, orderBy, page, limit } = dto.toQuery();
  assert.deepEqual(where, (await parse(FilterAndSearch, { search: '축제', filters: { createdAt: { gte: '2026-01-01' } } })).toQuery().where);
  assert.deepEqual({ orderBy, page, limit }, { orderBy: { createdAt: 'asc' }, page: 2, limit: 5 });
});

void test('OpenAPI exposes only the selected query capabilities', async () => {
  const app = await NestFactory.create(TestModule, { logger: false });
  try {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
    const names = (path: string) => document.paths[path].get!.parameters!.map((parameter) => 'name' in parameter ? parameter.name : '');
    assert.deepEqual(names('/test/search'), ['search']);
    assert.deepEqual(names('/test/filter').sort(), ['filters', 'search']);
    assert.deepEqual(names('/test/page').sort(), ['direction', 'limit', 'page', 'sort']);
  }
  finally { await app.close(); }
});
