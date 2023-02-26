/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { get } from 'lodash';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { LocalAuthGuard } from './local/local-auth.guard';

@Controller()
export class AuthController {
    constructor(private authService: AuthService) { }
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req: any) {
        return await this.authService.login(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req: any) {
        return await req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('switch-rich-menu')
    async switchMenu(@Request() req: any, @Body() input: any) {
        return await this.authService.switchRich(input);
    }
}
