import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  // Security and middleware
  app.use(helmet());
  app.use(compression());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8081', // React Native Metro
      /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Local network access for mobile
      'https://personapass.xyz', // Production frontend domain
      'https://www.personapass.xyz', // Production www domain
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  // Basic API info endpoint
  // Note: Swagger documentation removed for simplicity in Sprint 8
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Issuer Service running on http://localhost:${port}`);
  logger.log(`📱 Phone Verification API: http://localhost:${port}/issue-vc/phone`);
  logger.log(`📧 Email Verification API: http://localhost:${port}/issue-vc/email`);
  logger.log(`🔐 Password Authentication API: http://localhost:${port}/auth`);
}

bootstrap();