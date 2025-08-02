import { Module } from '@nestjs/common';
import { PersonaApiController } from './persona-api.controller';

// WALLET-ONLY AUTHENTICATION MODULE
// No phone or email verification - pure wallet-based authentication only

@Module({
  imports: [
    // No imports needed for wallet-only authentication
  ],
  controllers: [PersonaApiController],
  providers: [],
})
export class PersonaApiModule {}