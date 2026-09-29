import type { InternalServiceTermRequestDto } from '#/modules/service-terms/dto';

export class CreateInternalServiceTermCommand { constructor(public readonly input: InternalServiceTermRequestDto) {} }
export class UpdateInternalServiceTermCommand { constructor(public readonly input: { termId: string, dto: InternalServiceTermRequestDto }) {} }
export class DeleteInternalServiceTermCommand { constructor(public readonly termId: string) {} }
export class PublishInternalServiceTermCommand { constructor(public readonly termId: string) {} }
