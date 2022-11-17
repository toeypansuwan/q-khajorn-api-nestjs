/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService:UsersService,
    private jwtService: JwtService
  ){}

  async validateUser(email:string,password:string):Promise<any>{
      const user = await this.userService.findOneUser(email);
      
      if (user && await bcrypt.compare(password,user.password)) {
        const { password, ...result } = user;
        return result;
      }
      return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
