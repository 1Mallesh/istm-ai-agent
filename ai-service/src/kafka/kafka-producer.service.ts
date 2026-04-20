import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Partitioners } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'itsm-ai-service'),
      brokers: this.configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
    });
    this.producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('✅ AI Service Kafka producer connected');
    } catch (error) {
      this.logger.warn(`⚠️ Kafka unavailable: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish(topic: string, payload: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(payload) }],
      });
      this.logger.debug(`📤 Published to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish: ${error.message}`);
    }
  }
}
