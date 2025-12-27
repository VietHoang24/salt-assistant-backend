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

  console.log('allowed origins', allowed);
  // Configure CORS with proper options for credentials
  if (allowed.length > 0) {
    app.enableCors({
      origin: allowed, // Use ALLOWED_ORIGINS directly
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Authorization'],
    });
  } else {
    // In development, allow all origins if no config provided
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Authorization'],
      });
    } else {
      // In production, disable CORS if no origins specified (security)
      app.enableCors({ origin: false });
    }
  }

  // Configure global pipes BEFORE listening
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
