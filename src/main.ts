import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  Sentry.init({
    dsn: 'http://cb89d9453ca8a09b0200aa4963a9be6c@sentry.ozed.ru/2',
    release: '3.8.0',
    sampleRate: 1,
    debug: true,
    environment: 'Production',
    enabled: true,
    enableTracing: true,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });

  await app.listen(3000);
}

bootstrap();
