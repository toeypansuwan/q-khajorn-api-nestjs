/*
https://docs.nestjs.com/providers#services
*/

import { lab_models } from '@app/database/lab';
import { HttpException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService { 
    constructor(){}

    async signUp(signUpDto){
        try{
            const {password,email,fname,lname,password_verify} =signUpDto;
            const checkUniqueEmail = await new lab_models.OwnersTb().where('email',email).fetch()
            if(checkUniqueEmail){
                throw new HttpException("อีเมลนี้มีผู้ใช้งานแล้ว",400)
            }
            if(password_verify!=password){
                throw new HttpException("รหัสผ่านไม่ตรงกัน",400)
            }
            const hashPassword = await bcrypt.hashSync(password,10)
            const user = await new lab_models.OwnersTb({
                fname,
                lname,
                email,
                password:hashPassword
            }).save()
            return await user;
        }catch(e){
            throw new HttpException([e],400)
        }
    }
    async findOneUser(email: string): Promise<any> {
        const user = await new lab_models.OwnersTb().where('email',email).fetch();
        return user.attributes;
    }
}
