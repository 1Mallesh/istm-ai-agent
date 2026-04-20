import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { SystemEvent, SystemEventDocument } from './schemas/system-event.schema';

export interface DetectedAnomaly {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  confidenceScore: number;
  payload: Record<string, any>;
}

@Injectable()
export class AnomalyProcessorService {
  private readonly logger = new Logger(AnomalyProcessorService.name);
  private readonly recentEvents = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(SystemEvent.name) private eventModel: Model<SystemEventDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async process(anomaly: DetectedAnomaly): Promise<void> {
    const dedupeKey = `${anomaly.source}:${anomaly.type}:${anomaly.message}`;
    const lastSeen = this.recentEvents.get(dedupeKey);

    if (lastSeen && Date.now() - lastSeen < this.DEDUP_WINDOW_MS) {
      this.logger.debug(`Deduplicated event: ${dedupeKey}`);
      return;
    }

    this.recentEvents.set(dedupeKey, Date.now());

    const event = new this.eventModel({
      type: anomaly.type,
      severity: anomaly.severity,
      source: anomaly.source,
      message: anomaly.message,
      payload: anomaly.payload,
      aiConfidenceScore: anomaly.confidenceScore,
    });

    await event.save();

    if (anomaly.severity === 'error' || anomaly.severity === 'critical') {
      await this.kafkaProducer.publish('system.issue.detected', {
        type: anomaly.type,
        severity: anomaly.severity,
        source: anomaly.source,
        message: anomaly.message,
        payload: anomaly.payload,
        aiConfidenceScore: anomaly.confidenceScore,
        detectedAt: new Date().toISOString(),
      });

      this.logger.warn(
        `🚨 Anomaly detected [${anomaly.severity.toUpperCase()}]: ${anomaly.message} (confidence: ${(anomaly.confidenceScore * 100).toFixed(1)}%)`,
      );
    }
  }

  calculateConfidenceScore(metrics: Record<string, number>, thresholds: Record<string, number>): number {
    const scores = Object.entries(metrics).map(([key, value]) => {
      const threshold = thresholds[key];
      if (!threshold) return 0;
      return Math.min(value / threshold, 2.0);
    });

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.min(avg, 1.0);
  }
}
