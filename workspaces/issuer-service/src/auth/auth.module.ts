import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { PasswordAuthService } from './password-auth.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [PasswordAuthService],
  exports: [PasswordAuthService],
})
export class AuthModule {}