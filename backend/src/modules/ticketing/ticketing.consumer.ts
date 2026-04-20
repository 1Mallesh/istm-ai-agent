import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { KAFKA_TOPICS } from '../../kafka/kafka.constants';
import { TicketingService } from './ticketing.service';

@Injectable()
export class TicketingConsumer {
  private readonly logger = new Logger(TicketingConsumer.name);

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly ticketingService: TicketingService,
  ) {}

  async startListening() {
    await this.kafkaService.subscribe(
      'itsm-ticketing-group',
      [KAFKA_TOPICS.SYSTEM_ISSUE_DETECTED],
      async (topic, payload) => {
        this.logger.log(`[Ticketing] Received ${topic}: ${JSON.stringify(payload)}`);

        if (topic === KAFKA_TOPICS.SYSTEM_ISSUE_DETECTED) {
          const ticket = await this.ticketingService.createFromSystemEvent(payload);
          this.logger.log(`Auto-ticket created: ${ticket._id} for event from ${payload.source}`);
        }
      },
    );
  }
}
