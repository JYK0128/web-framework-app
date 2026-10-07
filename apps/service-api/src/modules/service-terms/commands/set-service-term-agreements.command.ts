import type { SetServiceTermAgreementsRequestDto } from '#/modules/service-terms/dto';

export class SetServiceTermAgreementsCommand { constructor(public readonly input: { userId: string, dto: SetServiceTermAgreementsRequestDto }) {} }
