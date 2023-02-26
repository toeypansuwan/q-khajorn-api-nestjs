/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { environment } from '@app/environments';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findOneUser(email);

    if (user && await bcrypt.compare(password, user.password)) {
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
  async switchRich(input) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${environment.lineConfig.channelAccessToken}`
      }
    }
    const data = {
      "size": {
        "width": 2500,
        "height": 1686
      },
      "selected": false,
      "name": "richmenu-a",
      "chatBarText": "Tap to open",
      "areas": [
        {
          "bounds": {
            "x": 0,
            "y": 0,
            "width": 1250,
            "height": 1686
          },
          "action": {
            "type": "uri",
            "uri": "https://developers.line.biz/"
          }
        },
        {
          "bounds": {
            "x": 1251,
            "y": 0,
            "width": 1250,
            "height": 1686
          },
          "action": {
            "type": "richmenuswitch",
            "richMenuAliasId": "richmenu-alias-b",
            "data": "richmenu-changed-to-b"
          }
        }
      ]
    }
    try {
      const res = await axios.post('https://api.line.me/v2/bot/richmenu', data, config)
      return true;
    } catch (err) {
      return false;
    }
  }
}
