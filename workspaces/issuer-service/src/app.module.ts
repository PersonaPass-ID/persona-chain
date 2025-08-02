import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration
import configuration from './config';

// Modules - WALLET-ONLY AUTHENTICATION
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