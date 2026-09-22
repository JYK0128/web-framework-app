import type { SetServiceTermAgreementsRequestDto } from '../dto';
export class SetServiceTermAgreementsCommand { constructor(public readonly input: { userId: string, dto: SetServiceTermAgreementsRequestDto }) {} }
