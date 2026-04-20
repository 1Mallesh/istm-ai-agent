import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketingController } from './ticketing.controller';
import { TicketingService } from './ticketing.service';
import { TicketingConsumer } from './ticketing.consumer';
import { Ticket, TicketSchema } from '../../database/schemas/ticket.schema';
import { SystemEvent, SystemEventSchema } from '../../database/schemas/system-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: SystemEvent.name, schema: SystemEventSchema },
    ]),
  ],
  controllers: [TicketingController],
  providers: [TicketingService, TicketingConsumer],
  exports: [TicketingService],
})
export class TicketingModule implements OnModuleInit {
  constructor(private readonly ticketingConsumer: TicketingConsumer) {}

  async onModuleInit() {
    await this.ticketingConsumer.startListening();
  }
}
