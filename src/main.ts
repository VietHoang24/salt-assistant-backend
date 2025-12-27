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

  // Configure CORS with proper options for credentials
  if (allowed.length > 0) {
    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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
