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
      enableDebugMessages: true, // Додаю debug повідомлення
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Chat CRM API')
    .setDescription('API documentation for Chat CRM application')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('health', 'Health check endpoints')
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
  
  // Записуємо openapi.json тільки в development режимі
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');
  
  if (nodeEnv === 'development') {
    try {
      writeFileSync('openapi.json', JSON.stringify(document, null, 2));
      logger.log('📚 OpenAPI documentation saved to openapi.json');
    } catch (error) {
      logger.warn('⚠️ Could not save OpenAPI documentation:', error.message);
    }
  }
  
  SwaggerModule.setup('api', app, document);
  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  });

  logger.log(`🔗 CORS Origins: ${corsOrigins.join(', ')}`);
  const isProduction = nodeEnv === 'production';
  const port = configService.get<number>('PORT') || configService.get<number>('API_PORT') || 5055;
  const host = '0.0.0.0'; // Listen on all interfaces for production

  await app.listen(port, host);
  logger.log(`📍 Environment: ${nodeEnv}`);
  logger.log(`🌐 Server: http://${host}:${port}`);
  if (!isProduction) {
    logger.log(`📚 Docs: http://${host}:${port}/api`);
  }
  logger.log(`🏥 Health: http://${host}:${port}/health`);
}
bootstrap();
