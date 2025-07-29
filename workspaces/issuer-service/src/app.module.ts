import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration
import configuration from './config';
import { DatabaseConfig } from './config/database.config';

// Modules
import { PhoneVerificationModule } from './phone-verification/phone-verification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    
    // Feature modules
    PhoneVerificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}