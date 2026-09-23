import type { AdminServiceTermRequestDto } from '../dto';
export class CreateAdminServiceTermCommand { constructor(public readonly input: AdminServiceTermRequestDto) {} }
export class UpdateAdminServiceTermCommand { constructor(public readonly input: { termId: string, dto: AdminServiceTermRequestDto }) {} }
export class DeleteAdminServiceTermCommand { constructor(public readonly termId: string) {} }
export class PublishAdminServiceTermCommand { constructor(public readonly termId: string) {} }
