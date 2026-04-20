import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnomalyProcessorService } from './anomaly-processor.service';
import { SystemEvent, SystemEventDocument } from './schemas/system-event.schema';

interface ServiceHealthCheck {
  name: string;
  url?: string;
  type: 'http' | 'process' | 'log';
}

@Injectable()
export class SoftwareDetectorService {
  private readonly logger = new Logger(SoftwareDetectorService.name);
  private readonly errorHistory: Map<string, number[]> = new Map();

  constructor(
    private readonly anomalyProcessor: AnomalyProcessorService,
    private readonly configService: ConfigService,
    @InjectModel(SystemEvent.name) private eventModel: Model<SystemEventDocument>,
  ) {}

  @Cron('*/60 * * * * *')
  async runSoftwareScan() {
    this.logger.debug('Running software anomaly scan...');
    await Promise.allSettled([
      this.analyzeErrorPatterns(),
      this.detectHighErrorRate(),
      this.checkServiceHealth(),
    ]);
  }

  async reportSoftwareError(payload: {
    service: string;
    errorType: string;
    message: string;
    stackTrace?: string;
    severity?: 'warning' | 'error' | 'critical';
  }) {
    const { service, errorType, message, stackTrace, severity = 'error' } = payload;

    const key = `${service}:${errorType}`;
    const now = Date.now();
    const windowMs = 60_000;

    const history = this.errorHistory.get(key) || [];
    const recentErrors = history.filter((t) => now - t < windowMs);
    recentErrors.push(now);
    this.errorHistory.set(key, recentErrors);

    const errorRate = recentErrors.length;
    const threshold = this.configService.get<number>('ERROR_RATE_THRESHOLD', 5);

    const isBurst = errorRate > threshold;
    const finalSeverity = isBurst ? 'critical' : severity;

    await this.anomalyProcessor.process({
      type: 'software_bug',
      severity: finalSeverity,
      source: `software.${service}`,
      message: isBurst
        ? `Error burst in ${service}: ${errorRate} errors/min — ${message}`
        : `Software error in ${service}: ${message}`,
      confidenceScore: isBurst ? 0.95 : 0.75,
      payload: {
        service,
        errorType,
        message,
        stackTrace: stackTrace?.substring(0, 500),
        errorRate,
        threshold,
        burstDetected: isBurst,
      },
    });
  }

  private async analyzeErrorPatterns() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const recentErrors = await this.eventModel.aggregate([
        {
          $match: {
            type: 'software_bug',
            createdAt: { $gte: fiveMinutesAgo },
          },
        },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            latestMessage: { $last: '$message' },
          },
        },
        { $match: { count: { $gte: 3 } } },
      ]);

      for (const pattern of recentErrors) {
        await this.anomalyProcessor.process({
          type: 'software_bug',
          severity: 'error',
          source: pattern._id,
          message: `Recurring error pattern detected: ${pattern.count} occurrences in 5 min — "${pattern.latestMessage}"`,
          confidenceScore: 0.88,
          payload: {
            source: pattern._id,
            occurrences: pattern.count,
            window: '5min',
            patternDetected: true,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error pattern analysis failed: ${error.message}`);
    }
  }

  private async detectHighErrorRate() {
    for (const [key, timestamps] of this.errorHistory.entries()) {
      const now = Date.now();
      const recent = timestamps.filter((t) => now - t < 60_000);
      this.errorHistory.set(key, recent);

      const threshold = this.configService.get<number>('ERROR_RATE_THRESHOLD', 5);
      if (recent.length >= threshold * 2) {
        const [service, errorType] = key.split(':');
        await this.anomalyProcessor.process({
          type: 'software_bug',
          severity: 'critical',
          source: `software.${service}`,
          message: `Critical error rate for ${service}: ${recent.length} errors/min`,
          confidenceScore: 0.95,
          payload: { service, errorType, errorRate: recent.length, threshold },
        });
      }
    }
  }

  private async checkServiceHealth() {
    const services: ServiceHealthCheck[] = [
      { name: 'itsm-backend', url: `${this.configService.get('BACKEND_API_URL', 'http://localhost:3001/api')}/health`, type: 'http' },
    ];

    for (const service of services) {
      if (service.type === 'http' && service.url) {
        try {
          const axios = require('axios');
          const start = Date.now();
          await axios.get(service.url, { timeout: 5000 });
          const responseTime = Date.now() - start;

          const threshold = this.configService.get<number>('RESPONSE_TIME_THRESHOLD', 2000);
          if (responseTime > threshold) {
            await this.anomalyProcessor.process({
              type: 'performance',
              severity: 'warning',
              source: `service.${service.name}`,
              message: `${service.name} responding slowly: ${responseTime}ms`,
              confidenceScore: 0.8,
              payload: { service: service.name, responseTime, threshold },
            });
          }
        } catch (error) {
          await this.anomalyProcessor.process({
            type: 'software_bug',
            severity: 'critical',
            source: `service.${service.name}`,
            message: `${service.name} is unreachable: ${error.message}`,
            confidenceScore: 0.99,
            payload: { service: service.name, error: error.message },
          });
        }
      }
    }
  }
}
