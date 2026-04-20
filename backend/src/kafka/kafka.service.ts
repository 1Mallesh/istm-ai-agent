import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin, Partitioners } from 'kafkajs';
import { KAFKA_TOPICS } from './kafka.constants';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  private admin: Admin;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'itsm-backend'),
      brokers: this.configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(','),
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });

    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      await this.admin.connect();
      await this.ensureTopicsExist();
      this.logger.log('✅ Kafka producer connected');
    } catch (error) {
      this.logger.warn(`⚠️ Kafka connection failed (running without Kafka): ${error.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      await this.admin.disconnect();
    } catch (error) {
      this.logger.error('Error disconnecting Kafka:', error.message);
    }
  }

  private async ensureTopicsExist() {
    const topics = Object.values(KAFKA_TOPICS).map((topic) => ({
      topic,
      numPartitions: 3,
      replicationFactor: 1,
    }));

    try {
      await this.admin.createTopics({ topics, waitForLeaders: true });
      this.logger.log(`✅ Kafka topics ensured: ${Object.values(KAFKA_TOPICS).join(', ')}`);
    } catch (error) {
      this.logger.warn(`Topics may already exist: ${error.message}`);
    }
  }

  async publish<T>(topic: string, payload: T, key?: string): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(payload),
            headers: {
              timestamp: Date.now().toString(),
              source: 'itsm-backend',
            },
          },
        ],
      });
      this.logger.debug(`📤 Published to ${topic}: ${JSON.stringify(payload)}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${topic}:`, error.message);
      // Don't throw — Kafka failures should not break the main flow
    }
  }

  async subscribe(
    groupId: string,
    topics: string[],
    handler: (topic: string, payload: any) => Promise<void>,
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });

    try {
      await consumer.connect();
      for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: false });
      }

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const payload = JSON.parse(message.value?.toString() || '{}');
            await handler(topic, payload);
          } catch (error) {
            this.logger.error(`Error processing message from ${topic}:`, error.message);
          }
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`✅ Consumer [${groupId}] subscribed to: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.warn(`⚠️ Consumer [${groupId}] failed to subscribe: ${error.message}`);
    }
  }
}
