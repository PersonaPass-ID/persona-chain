import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration
import configuration from './config';
import { DatabaseConfig } from './config/database.config';

// Modules
import { PhoneVerificationModule } from './phone-verification/phone-verification.module';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { AuthModule } from './auth/auth.module';
import { PersonaApiModule } from './persona-api/persona-api.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    
    // Database temporarily disabled for pure wallet auth
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useClass: DatabaseConfig,
    // }),
    
    // Feature modules - ONLY wallet auth, no phone/email!
    PersonaApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}