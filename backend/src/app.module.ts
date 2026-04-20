import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OffboardingModule } from './modules/offboarding/offboarding.module';
import { ProvisioningModule } from './modules/provisioning/provisioning.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { TicketingModule } from './modules/ticketing/ticketing.module';
import { AdminConfigModule } from './modules/admin-config/admin-config.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/itsm-agent'),
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('✅ MongoDB connected'));
          connection.on('error', (err) => console.error('❌ MongoDB error:', err));
          return connection;
        },
      }),
    }),
    KafkaModule,
    AuthModule,
    UserModule,
    OnboardingModule,
    OffboardingModule,
    ProvisioningModule,
    IntegrationModule,
    TicketingModule,
    AdminConfigModule,
  ],
})
export class AppModule {}
