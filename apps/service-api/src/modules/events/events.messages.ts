import type { CreateEventRequestDto, GetEventsRequestDto, GetPublicEventsRequestDto, UpdateEventRequestDto } from './events.dto';

export class GetEventsQuery { constructor(readonly input: GetEventsRequestDto) {} }
export class GetEventQuery { constructor(readonly id: string, readonly publicOnly = false) {} }
export class CreateEventCommand { constructor(readonly input: CreateEventRequestDto) {} }
export class UpdateEventCommand { constructor(readonly id: string, readonly input: UpdateEventRequestDto) {} }
export class DeleteEventCommand { constructor(readonly id: string) {} }

export class GetPublicEventsQuery { constructor(readonly input: GetPublicEventsRequestDto) {} }
