import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3002);

  await app.listen(port);
  console.log(`🤖 ITSM AI Service running on http://localhost:${port}`);
}

bootstrap();
