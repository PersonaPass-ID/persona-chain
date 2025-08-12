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
  
  // Global API prefix to match PersonaApiClient expectations
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 PersonaPass Wallet-Only API running on http://localhost:${port}`);
  logger.log(`⛓️  Wallet DID Creation API: http://localhost:${port}/api/did/create`);
  logger.log(`🔍 Wallet Credentials API: http://localhost:${port}/api/credentials/:address`);
  logger.log(`✅ Health Check API: http://localhost:${port}/api/health`);
}

bootstrap();