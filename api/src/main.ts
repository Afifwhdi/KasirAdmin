import { NestFactory } from '@nestjs/core';
import { Logger, LogLevel } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logLevels: LogLevel[] = ['error', 'warn'];
  const app = await NestFactory.create(AppModule, { logger: logLevels });

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);

  const displayHost = host === '0.0.0.0' ? 'localhost' : host;

  Logger.log(`✅ API running at http://${displayHost}:${port}`, 'Bootstrap');
}
void bootstrap();
