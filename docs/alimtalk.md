# 카카오 알림톡

`admin-api`와 `service-api`의 `core/services/message`에서 같은 계약을 사용한다.
`MessageService.send({ channel: 'alimtalk', message, config })`를 호출하면 `MessengerAdapter`가 `AlimtalkAdapter`로 전달한다.
대행사는 기존 `delivery.messenger.kakao.agency` 설정으로 선택한다. 인프라 모듈 변경은 없다.

```ts
await messages.send({
  channel: 'alimtalk',
  config: delivery.messenger, // enabled: true, provider: KAKAO 및 복호화된 대행사 설정
  message: {
    recipient: '01012345678',
    templateCode: 'APPROVED_TEMPLATE', // SOLAPI: templateId
    content: '#{이름}님, 주문 #{주문번호}이 접수되었습니다.',
    variables: { 이름: '홍길동', 주문번호: 'ORDER-123' },
    buttons: [{ type: 'WL', name: '주문 확인', linkMo: 'https://example.com/orders/#{주문번호}' }],
  },
});
```

템플릿 코드와 본문은 해당 대행사에 승인된 값을 사용해야 한다. 줄바꿈도 승인 본문과 동일해야 한다.
`variables` 키는 `이름`처럼 괄호 없이 입력한다. 본문과 버튼의 `#{변수명}`을 `MessageTemplateService`가 치환하며 누락된 변수는 발송 전에 실패한다.
변수 치환 후 본문은 1,000자, 버튼은 최대 5개이다. 일반 텍스트형과 WL·AL·DS·BK·MD·AC 버튼을 지원한다.
이미지형·아이템 리스트형·강조형 템플릿 전용 필드는 지원하지 않는다.

| 대행사 | 설정 및 메시지 입력 | 요청 |
| --- | --- | --- |
| NHN Cloud | `nhn.appKey`, `nhn.secretKey`, `senderKey` | v2.2 raw-messages, X-Secret-Key |
| SOLAPI | `solapi.apiKey`, `solapi.apiSecret`, `senderKey` 또는 메시지의 `pfId` | v4 send-many/detail, HMAC-SHA256 |
| 알리고 | `aligo.userId`, `aligo.apiKey`, `senderKey`, 메시지의 `sender`·`title` | akv10/alimtalk/send, 폼 인코딩 |

모든 대행사에서 문자 대체 발송은 명시적으로 비활성화한다. 알리고 발신번호는 사전 등록된 번호를 사용한다.
성공 결과는 **대행사 발송 접수**를 의미하며 실제 수신 완료를 의미하지 않는다. `messageId`는 대행사 요청/메시지 ID이다.
HTTP 오류와 HTTP 200 내부 접수 실패를 구분하며, 잘못된 응답은 성공으로 처리하지 않는다. 타임아웃 후 자동 재시도는 하지 않는다.

관리자 서비스 설정의 메신저 테스트에서 템플릿·본문·변수·버튼과 필요한 대행사 입력을 제공할 수 있다.
테스트 입력은 설정 저장에서 제외한다. 별도 템플릿 등록·승인·발송 이력 관리 기능은 포함하지 않는다.
테스트 버튼은 실제 발송 요청을 보낸다.

## 검증

`pnpm --filter admin-api test:alimtalk` 및 `pnpm --filter service-api test:alimtalk`은 외부 HTTP를 모의 처리한다.
대행사별 요청 매핑, HMAC 서명, 변수 치환, HTTP 및 내부 접수 실패, DTO 검증과 발송 전 오류를 검증하며 실제 메시지는 발송하지 않는다.

공식 규격: [NHN Cloud](https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-api-guide-v2.2/), [SOLAPI](https://solapi.com/developers/api/messages), [알리고](https://smartsms.aligo.in/alimapi.html).
