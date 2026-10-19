import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AlimtalkAdapter } from '../src/core/notification/adapters/messenger/alimtalk.adapter';
import { MessageTemplateService } from '../src/core/notification/message-template.service';
import { ApplicationError } from '@pkg/shared/common';
import { AlimtalkMessageDto, type MessengerConfigDto } from '@pkg/server-core/notification/dto';

const adapter = new AlimtalkAdapter(new MessageTemplateService());
const message: AlimtalkMessageDto & { recipient: string } = { recipient: '01012345678', templateCode: 'approved', content: '#{이름}님 주문 #{주문} 확인', variables: { 이름: '홍길동', 주문: '123' }, buttons: [{ type: 'WL', name: '확인', linkMo: 'https://example.com/#{주문}' }], sender: '0212345678', title: '주문 확인' };
const config: MessengerConfigDto = { enabled: true, provider: 'KAKAO', kakao: { senderKey: 'sender', agency: 'NHN_CLOUD', nhn: { appKey: 'app', secretKey: 'secret' }, solapi: { apiKey: 'key', apiSecret: 'secret' }, aligo: { userId: 'user', apiKey: 'key' } } };
const originalFetch = globalThis.fetch;
let calls = 0;
let reply: unknown;
let status = 200;
let inspect: (url: string, options: RequestInit) => void = () => {};
globalThis.fetch = async (url, options) => {
  calls++;
  inspect(String(url), options ?? {});
  return new Response(JSON.stringify(reply), { status, headers: { 'Content-Type': 'application/json' } });
};
try {
  inspect = (url, options) => {
    assert.match(url, /\/alimtalk\/v2.2\/appkeys\/app\/raw-messages$/);
    assert.equal((options.headers as Record<string, string>)['X-Secret-Key'], 'secret');
    const payload = JSON.parse(String(options.body));
    assert.equal(payload.recipientList[0].content, '홍길동님 주문 123 확인');
    assert.equal(payload.recipientList[0].buttons[0].linkMo, 'https://example.com/123');
    assert.equal(payload.recipientList[0].resendParameter.isResend, false);
  };
  reply = { header: { isSuccessful: true }, message: { requestId: 'nhn-id', sendResults: [{ resultCode: 0 }] } };
  assert.equal(await adapter.send(message, config), 'nhn-id');
  reply = { header: { isSuccessful: true }, message: { requestId: 'id', sendResults: [{ resultCode: -1, resultMessage: 'rejected' }] } };
  await assert.rejects(adapter.send(message, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  config.kakao!.agency = 'SOLAPI';
  inspect = (url, options) => {
    assert.equal(url, 'https://api.solapi.com/messages/v4/send-many/detail');
    const auth = (options.headers as Record<string, string>).Authorization;
    const date = /date=([^,]+)/.exec(auth)![1];
    const salt = /salt=([^,]+)/.exec(auth)![1];
    assert.ok(auth.endsWith(createHmac('sha256', 'secret').update(date + salt).digest('hex')));
    const payload = JSON.parse(String(options.body));
    assert.equal(payload.messages[0].kakaoOptions.disableSms, true);
    assert.equal(payload.messages[0].kakaoOptions.variables['#{이름}'], '홍길동');
    assert.equal(payload.messages[0].kakaoOptions.buttons[0].buttonType, 'WL');
  };
  reply = { failedMessageList: [], messageList: [{ messageId: 'solapi-id', statusCode: '2000' }] };
  assert.equal(await adapter.send(message, config), 'solapi-id');
  reply = { failedMessageList: [{ statusMessage: 'invalid template' }], messageList: [] };
  await assert.rejects(adapter.send(message, config), (error: unknown) => error instanceof ApplicationError && error.cause instanceof Error && error.cause.message.includes('invalid template'));
  config.kakao!.agency = 'ALIGO';
  inspect = (url, options) => {
    assert.equal(url, 'https://kakaoapi.aligo.in/akv10/alimtalk/send/');
    const body = new URLSearchParams(String(options.body));
    assert.equal(body.get('message_1'), '홍길동님 주문 123 확인');
    assert.equal(body.get('failover'), 'N');
    assert.equal(JSON.parse(body.get('button_1')!).button[0].linkType, 'WL');
  };
  reply = { code: 0, info: { mid: 123, scnt: 1, fcnt: 0 } };
  assert.equal(await adapter.send(message, config), '123');
  reply = { code: 0, info: { mid: 123, scnt: 0, fcnt: 1 } };
  await assert.rejects(adapter.send(message, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  inspect = () => {};
  reply = {};
  await assert.rejects(adapter.send(message, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  status = 500;
  await assert.rejects(adapter.send(message, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  const invalid = plainToInstance(AlimtalkMessageDto, { ...message, variables: { 이름: 123 }, buttons: [{ type: 'INVALID', name: '' }] });
  assert.ok((await validate(invalid)).length >= 2);
  assert.equal((await validate(plainToInstance(AlimtalkMessageDto, message))).length, 0);
  const before = calls;
  await assert.rejects(adapter.send({ ...message, buttons: [{ type: 'WL', name: '확인' }] }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send({ ...message, buttons: [{ type: 'AL', name: '앱 열기' }] }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send({ ...message, variables: {} }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send({ ...message, content: 'x'.repeat(1001) }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send({ ...message, templateCode: '' }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send({ ...message, recipient: 'invalid' }, config), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  await assert.rejects(adapter.send(message, { ...config, enabled: false }), (error: unknown) => error instanceof ApplicationError && error.code === 'NOTIFICATION_SEND_FAILED');
  assert.equal(calls, before);
  console.log('Alimtalk: provider requests, signatures, rendering, rejection and validation passed.');
}
finally { globalThis.fetch = originalFetch; }
