# Response DTO 패턴

## 명명

- 요청: `{Action}RequestDto`
- 응답: `{Action}ResponseDto`
- List/Page/Cursor 응답의 원소: `{Resource}ItemDto`
- 내부 객체: `{Parent}{Child}Dto`
- 메타데이터: `{Parent}MetadataDto`

파생 필드도 Item DTO에 둔다. 별도의 `With...`, `CountDto`, `ReadStatusDto`를 만들지 않는다.

## 구조

- Request와 Response는 별도 파일로 둔다.
- 생성·수정·삭제 응답은 각각 독립된 Response DTO로 둔다.
- 공통 부모 DTO를 새로 만들지 않는다.

## 변환

핸들러는 Response DTO의 `fromPlain()`을 호출한다.

```ts
private process(result: PageResult<Inquiry>): GetInquiriesResponseDto {
  return GetInquiriesResponseDto.fromPlain(result);
}
```

관계 데이터를 응답 필드로 평탄화할 때는 Item DTO의 `@Transform`을 사용한다.

```ts
@Transform(({ obj }: { obj: InquiryPlain }) => obj.user?.id ?? obj.userId)
userId!: string;
```

별도 조회·집계 결과가 필요한 필드는 핸들러에서 plain object에 추가한 뒤 `fromPlain()`에 전달한다.

```ts
const items = roles.map((role) => ({
  ...role,
  userCount: counts[role.key] ?? 0,
}));

return GetRolesResponseDto.fromPlain({ items });
```

컬렉션 필드에는 `@Type(() => ChildItemDto)`를 지정한다. MikroORM `Collection`은 Item DTO에서 배열로 변환한다.

수정 후 `pnpm typecheck`를 실행한다.

## 관련 파일

- `src/common/dto/base.dto.ts`
- `src/modules/notices/dto/get-notices.response.dto.ts`
- `src/modules/inquiries/dto/inquiry-item.dto.ts`
