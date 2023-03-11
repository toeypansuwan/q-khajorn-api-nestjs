/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from '../user/users.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { environment } from '@app/environments';
import { LineId } from './dto/auth.dto';
import { lab_models } from '@app/database/lab';

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
  async switchRich(input: LineId): Promise<any> {

    const config = {
      headers: {
        Authorization: `Bearer ${environment.lineConfig.channelAccessToken}`,
      }
    }
    try {
      const market = await new lab_models.MarketTb().where('key', input.key).fetch();
      if (!market) {
        throw new HttpException("ไม่พบตลาดนี้", 404)
      }
      const user = await new lab_models.UserTb().where('line_id', input.lineId).fetch()
      if (!user) {
        throw new HttpException("ไม่พบผู้ใช้", 404)
      }
      await market.save({ admin_id: user.get('id') }, { method: 'update' })
      const res = await axios.post(`https://api.line.me/v2/bot/user/${input.lineId}/richmenu/${environment.lineConfig.loginRichMenu}`, {}, config)
      return {
        res_code: 200
      };
    } catch (err) {
      throw new HttpException(err.response.data, err.response.status);
    }
  }
}