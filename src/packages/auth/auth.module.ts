import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { UsersModule } from '../user/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local/local.strategy';
import { environment } from '@app/env';
import { JwtStrategy } from './jwt/jwt.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: environment.JWT_SECRET,
            signOptions: { expiresIn: '2d' },
        })
    ],
    controllers: [
        AuthController],
    providers: [
        AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule { }
