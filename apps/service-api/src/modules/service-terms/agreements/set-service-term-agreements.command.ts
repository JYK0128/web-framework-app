import type { SetServiceTermAgreementsRequestDto } from '#/modules/service-terms';

export class SetServiceTermAgreementsCommand { constructor(public readonly input: { userId: string, dto: SetServiceTermAgreementsRequestDto }) {} }
