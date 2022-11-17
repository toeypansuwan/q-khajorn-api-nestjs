import { IsEmail, IsNotEmpty, isValidationOptions } from "class-validator";

export class ownerDto{
    @IsNotEmpty({message:"Username is not Empty"})
    username:string

    @IsNotEmpty({message:"Password is not Empty"})
    password:string

    @IsEmail({},{message:"Please enter your email correct"})
    @IsNotEmpty({message:"Email is not Empty"})
    email:string
}