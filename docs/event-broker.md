# 이벤트 브로커 발행·소비

관리자 API와 서비스 API의 구현·계약은 동일하다. 자원 선택·연결은 `infra/infra.module.ts`와 `EventBrokerModule.forRoot`에서 구성한다. 현재 등록은 in-memory와 Redis Pub/Sub이며 기본 선택은 in-memory다. Redis Streams·RabbitMQ·Kafka는 옵션을 전달해 등록해야 사용할 수 있다. 이번 변경은 기존 미응답 SSE 알림의 브로커 선택을 바꾸지 않는다.

```ts
const stop = await broker.subscribe<MyEvent>(
  MyEvent.name,
  async (event) => {
    await handler.handle(event); // 반드시 완료를 기다리고 실패를 throw
  },
  { group: 'message-workers', retryIdleMs: 30_000 },
);
await broker.publish(new MyEvent(/* ... */));
// 구독자 종료 시
await stop();
```

발행 완료는 브로커 전달/저장 완료다. 소비자의 업무 완료까지 기다리는 RPC가 아니다. 미등록 어댑터·연결 단절·발행 실패는 호출자에게 오류를 전달한다. `publishAll`도 실패를 반환한다. 소비자 실패를 발행자에게 되돌려주지는 않는다(in-memory 직접 구독은 예외).

| 어댑터 | 소비·완료 처리 |
| --- | --- |
| in-memory | 직접 등록한 구독 콜백의 Promise를 기다림. 기존 Nest CQRS EventBus 발행 유지; CQRS 핸들러 완료·내구성은 보장하지 않음 |
| redis-pubsub | 비동기 구독 콜백의 실패를 잡아 로깅. 보관·ACK·재전달 없음 |
| redis-streams | XREADGROUP 소비, 성공 XACK, 실패는 pending 유지, XAUTOCLAIM으로 idle 작업 회수 |
| rabbitmq | topic exchange, consumer group별 queue, prefetch 1, 성공 ACK, 실패 NACK/requeue; publisher confirm |
| kafka | 이벤트별 topic, 성공 후 offset+1 명시적 commit, 실패는 미커밋 상태로 KafkaJS 재시도·소비자 재시작 경로 사용 |

Redis Streams의 실제 그룹은 `<group>:<eventName>`, RabbitMQ queue는 `<group>.<eventName>`, Kafka group은 `<group>.<eventName>`, Kafka topic은 `<topic-prefix>.<eventName>`이다. 동일 이벤트·그룹의 소비자들은 작업을 분담하고 다른 그룹은 독립적으로 소비한다. Streams group 최초 생성은 `0`, Kafka 새 그룹은 `fromBeginning: true`라서 보관된 과거 이벤트도 처리한다. Pub/Sub는 모든 구독 서버에 전달된다.

## CQRS 이벤트 수신

업무 처리는 `Controller → Command/Query → Handler`로 실행한다. Q&A·상담의 저장과 이벤트 발행은 해당 핸들러에서 수행하고, 스케줄러는 Command만 실행한다. 브로커·SSE·WebSocket 전송 서비스는 인프라 역할을 유지한다.

업무 이벤트 수신은 `*.handler.ts`의 `@EventsHandler(Event)`와 `IEventHandler<Event>`로 통일한다. 외부 브로커를 사용하는 핸들러에는 `@BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: 'workers' })`처럼 연결과 소비자 옵션을 지정한다. 기본 주입 브로커를 사용하려면 `@BrokerConsumer()`를 사용한다.

`BrokerEventHandlers`가 시작 시 핸들러를 탐색해 구독하고 종료 시 해제한다. 외부 이벤트는 해당 이벤트 클래스의 프로토타입을 복원하고 `handle()` 완료를 직접 기다린다. 모든 핸들러가 성공해야 구독 콜백이 성공하며, 예외는 어댑터에 전파되어 기존 ACK·재전달 정책을 따른다. 같은 이벤트·브로커·소비자 옵션의 핸들러들은 하나의 구독에서 순서대로 실행한다. 재전달 시 이미 성공했던 핸들러도 다시 실행될 수 있으므로 부작용은 멱등성을 갖춰야 한다.

인메모리 브로커는 이미 Nest EventBus로 이벤트를 발행하므로 별도 구독을 추가하지 않아 중복 실행을 방지한다. 인메모리 CQRS 핸들러의 완료 보장은 기존과 동일하다. 외부 수신에서는 `EventBus.publish()`로 재발행하지 않으며, ACK를 위해 선택된 핸들러의 완료를 기다린다. `@BrokerConsumer`는 `@EventsHandler`와 함께 사용해야 하고, 필요한 브로커가 등록되지 않으면 시작에 실패한다. SSE 스트림 서비스는 스트림 제공과 토픽 라우팅을 맡는다.

## 운영 시 필요한 계약

- Redis Streams는 XAUTOCLAIM을 지원하는 Redis 6.2 이상이 필요하다. `retryIdleMs`는 정상 처리의 최대 소요 시간보다 길게 설정한다. 짧으면 다른 소비자가 아직 처리 중인 작업을 회수할 수 있다. 회수 중에도 신규 작업을 소비한다.
- Kafka topic은 배포에서 미리 생성한다. 파티션·복제·보관 정책은 브로커 운영 설정이다. 긴 작업은 Kafka 세션·heartbeat 제약을 고려해야 한다.
- RabbitMQ는 queue를 최초 구독할 때 생성·바인딩한다. 최초 구독 이전에 발행된 이벤트는 보관되지 않을 수 있다. 배포 준비 단계에서 queue/binding을 구성한다. `durable` 기본값은 true이고 메시지도 persistent로 발행한다. publisher confirm은 소비 완료나 라우팅 성공을 보장하지 않는다.
- 재전달되는 작업은 중복 실행될 수 있다. 부작용이 있는 업무는 멱등성을 갖춰야 한다. 이 어댑터들은 exactly-once를 보장하지 않는다.
- 실패 횟수 제한·지연 재시도·DLQ·업무 실패 이력은 이번 변경에 포함하지 않는다. RabbitMQ의 기본 NACK은 즉시 재전달이므로 영구 실패를 계속 throw하면 반복될 수 있다. 필요 시 작업 서비스/브로커 운영 정책으로 제한한다.
- RabbitMQ 연결 복원은 자동 재구독까지 제공하지 않는다. 연결 장애 후 프로세스 재시작 등 운영 복구가 필요하다. 구독 종료·모듈 종료에서 소비 연결을 해제한다.
- Redis stream의 maxLen이나 Kafka 보관 기간으로 삭제된 작업은 복구할 수 없다. 보관 정책은 업무의 복구 요구에 맞춰 설정한다.

## 통합 검증

외부 발송 없이 전용 테스트 브로커에서 실행한다. 테스트는 Redis `localhost:16389`, RabbitMQ `localhost:15679`, Kafka `localhost:19092`를 사용한다. 고유 stream/exchange/topic을 생성하며 운영 브로커에서 실행하지 않는다. Kafka 테스트 계정에는 topic 생성 권한이 필요하다. 테스트용 컨테이너를 종료·삭제하면 테스트 자원도 함께 제거된다.

```sh
pnpm --filter admin-api test:event-broker
pnpm --filter service-api test:event-broker
```

검증 범위: 비동기 콜백 완료, 발행 오류 전파, 실패 재전달, Redis pending ACK 확인, 구독 중단 중 보관된 작업 재소비, 구독·연결 종료. 테스트 빌드 산출물은 실행 후 제거한다.

`EventBrokerModule.forRoot()`는 인메모리를 기본으로 제공한다. 옵션에는 `redisPubSub`, `redisStreams`, `rabbitmq`, `kafka` 연결 설정과 선택적인 `defaultAdapter`를 지정한다. `defaultAdapter`를 생략하면 인메모리이고, 지정하면 `EventBroker` 기본 주입 대상만 변경한다. 등록하지 않은 기본 어댑터는 모듈 등록 시 오류다. 발행·구독 시 `adapter` 옵션은 없다.

```ts
// infra.module.ts
EventBrokerModule.forRoot({
  defaultAdapter: 'redis-pubsub',
  redisPubSub: { url: env.REDIS_URL, topic: 'events' },
});

// 기본 인메모리 사용처
constructor(private readonly broker: EventBroker) {}

// Redis Pub/Sub 사용처
constructor(@Inject(EVENT_BROKER.REDIS_PUBSUB) private readonly broker: EventBroker) {}
```

각 등록된 브로커는 `EVENT_BROKER.IN_MEMORY`, `REDIS_PUBSUB`, `REDIS_STREAMS`, `RABBITMQ`, `KAFKA` 토큰으로 선택한다. 연결 설정이 없는 외부 브로커의 토큰은 등록하지 않으므로, 사용처에서 이를 요구하면 Nest 의존성 주입이 실패한다. 구독의 `group`, `consumer`, `retryIdleMs`는 소비 동작 옵션으로 유지한다.
외부 자원 없이 기본 주입과 인메모리 동작을 검증하려면 `pnpm --filter <api> test:event-broker --memory-only`를 실행한다.

```ts
EventBrokerModule.forRoot({
  defaultAdapter: 'redis-pubsub',
  redisPubSub: { url: env.REDIS_URL, topic: 'events' },
});
// EventBroker 기본 주입: Redis Pub/Sub
// EVENT_BROKER.IN_MEMORY 명시적 주입: 인메모리
```
