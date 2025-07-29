import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';
import { TwilioService } from './twilio.service';
import { VcIssuerService } from './vc-issuer.service';

@Module({
  imports: [ConfigModule],
  controllers: [PhoneVerificationController],
  providers: [
    PhoneVerificationService,
    TwilioService,
    VcIssuerService,
  ],
  exports: [PhoneVerificationService],
})
export class PhoneVerificationModule {}