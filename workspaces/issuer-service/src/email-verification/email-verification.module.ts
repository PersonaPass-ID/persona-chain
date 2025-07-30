import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';
import { EmailVcIssuerService } from './email-vc-issuer.service';
import { SendGridService } from './sendgrid.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailVerificationController],
  providers: [
    EmailVerificationService,
    EmailVcIssuerService,
    SendGridService,
  ],
  exports: [
    EmailVerificationService,
    EmailVcIssuerService,
  ],
})
export class EmailVerificationModule {}