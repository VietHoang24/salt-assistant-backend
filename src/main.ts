import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS origins from environment variable `ALLOWED_ORIGINS` (comma-separated)
  // Example: ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  const allowed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ''));

  if (allowed.length > 0) {
    app.enableCors({ origin: allowed, credentials: true });
  } else {
    // disable CORS if no origins specified
    app.enableCors({ origin: false });
  }

  await app.listen(process.env.PORT ?? 3000);

  // main.ts
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}
bootstrap();
