/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post ,Body} from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
    constructor(private userService:UsersService){}

    @Post('signup')
    signUp(@Body() signUpDto:SignUpDto){
        return this.userService.signUp(signUpDto);
    }

}
