import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as si from 'systeminformation';
import { AnomalyProcessorService } from './anomaly-processor.service';

@Injectable()
export class HardwareDetectorService {
  private readonly logger = new Logger(HardwareDetectorService.name);

  constructor(
    private readonly anomalyProcessor: AnomalyProcessorService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async runHardwareScan() {
    this.logger.debug('Running hardware scan...');
    await Promise.allSettled([
      this.checkCpuUsage(),
      this.checkMemoryUsage(),
      this.checkDiskUsage(),
      this.checkNetworkHealth(),
    ]);
  }

  private async checkCpuUsage() {
    try {
      const load = await si.currentLoad();
      const cpuUsage = load.currentLoad;
      const threshold = this.configService.get<number>('CPU_THRESHOLD', 85);

      if (cpuUsage > threshold) {
        const confidence = this.anomalyProcessor.calculateConfidenceScore(
          { cpu: cpuUsage },
          { cpu: threshold },
        );

        await this.anomalyProcessor.process({
          type: 'hardware_fault',
          severity: cpuUsage > 95 ? 'critical' : 'error',
          source: 'system.cpu',
          message: `CPU usage critically high: ${cpuUsage.toFixed(1)}%`,
          confidenceScore: confidence,
          payload: {
            cpuUsage: cpuUsage.toFixed(2),
            threshold,
            cores: load.cpus?.length,
            perCoreLoad: load.cpus?.map((c) => c.load.toFixed(1)),
          },
        });
      }
    } catch (error) {
      this.logger.error(`CPU check failed: ${error.message}`);
    }
  }

  private async checkMemoryUsage() {
    try {
      const mem = await si.mem();
      const usagePercent = ((mem.used / mem.total) * 100);
      const threshold = this.configService.get<number>('MEMORY_THRESHOLD', 90);

      if (usagePercent > threshold) {
        const confidence = this.anomalyProcessor.calculateConfidenceScore(
          { memory: usagePercent },
          { memory: threshold },
        );

        await this.anomalyProcessor.process({
          type: 'hardware_fault',
          severity: usagePercent > 95 ? 'critical' : 'error',
          source: 'system.memory',
          message: `Memory usage high: ${usagePercent.toFixed(1)}%`,
          confidenceScore: confidence,
          payload: {
            usedGB: (mem.used / 1e9).toFixed(2),
            totalGB: (mem.total / 1e9).toFixed(2),
            usagePercent: usagePercent.toFixed(2),
            threshold,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Memory check failed: ${error.message}`);
    }
  }

  private async checkDiskUsage() {
    try {
      const disks = await si.fsSize();
      const threshold = this.configService.get<number>('DISK_THRESHOLD', 80);

      for (const disk of disks) {
        const usagePercent = disk.use;
        if (usagePercent > threshold) {
          const confidence = this.anomalyProcessor.calculateConfidenceScore(
            { disk: usagePercent },
            { disk: threshold },
          );

          await this.anomalyProcessor.process({
            type: 'hardware_fault',
            severity: usagePercent > 90 ? 'critical' : 'error',
            source: `system.disk.${disk.mount}`,
            message: `Disk ${disk.mount} usage high: ${usagePercent.toFixed(1)}%`,
            confidenceScore: confidence,
            payload: {
              mount: disk.mount,
              usedGB: (disk.used / 1e9).toFixed(2),
              totalGB: (disk.size / 1e9).toFixed(2),
              usagePercent: usagePercent.toFixed(2),
              threshold,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Disk check failed: ${error.message}`);
    }
  }

  private async checkNetworkHealth() {
    try {
      const stats = await si.networkStats();

      for (const iface of stats) {
        if (iface.iface === 'lo') continue;

        const errorRate = iface.tx_errors + iface.rx_errors;
        if (errorRate > 100) {
          await this.anomalyProcessor.process({
            type: 'connectivity',
            severity: 'warning',
            source: `system.network.${iface.iface}`,
            message: `Network errors detected on ${iface.iface}: ${errorRate} errors`,
            confidenceScore: 0.75,
            payload: {
              interface: iface.iface,
              txErrors: iface.tx_errors,
              rxErrors: iface.rx_errors,
              totalErrors: errorRate,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Network check failed: ${error.message}`);
    }
  }
}
