import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCorsOrigins } from './config/cors';
import { writeFileSync } from 'fs';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Додаю глобальний ValidationPipe з transform: true
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chat CRM API')
    .setDescription('API documentation for Chat CRM application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  SwaggerModule.setup('api', app, document);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');
  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  logger.log(`🔗 CORS Origins: ${corsOrigins.join(', ')}`);
  const isProduction = nodeEnv === 'production';
  const port = configService.get<number>('API_PORT') || 5000;
  const host = 'localhost';

  await app.listen(port);
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`🌐 Server: http://${host}:${port}`);
  if (!isProduction) {
    logger.log(`📚 Docs: http://${host}:${port}/api`);
  }
}
bootstrap();
