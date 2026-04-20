import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HardwareDetectorService } from './hardware-detector.service';
import { SoftwareDetectorService } from './software-detector.service';
import { AnomalyProcessorService } from './anomaly-processor.service';
import { SystemEvent, SystemEventSchema } from './schemas/system-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SystemEvent.name, schema: SystemEventSchema }]),
  ],
  providers: [HardwareDetectorService, SoftwareDetectorService, AnomalyProcessorService],
})
export class DetectorModule {}
