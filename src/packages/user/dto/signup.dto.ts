import { IsNotEmpty, MinLength } from "class-validator";

export class SignUpDto{
    @IsNotEmpty({message:"กรุณากรอกชื่อ"})
    fname:string

    @IsNotEmpty({message:"กรุณากรอกนามสกุล"})
    lname:string

    @IsNotEmpty({message:"กรุณากรอกอีเมล"})
    email:string

    @IsNotEmpty({message:"กรุณากรอกรหัสผ่าน"})
    @MinLength(8,{message:"รหัสผ่าน 8 หลักขึ้นไป"})
    password:string

    @IsNotEmpty({message:"กรุณากรอกยืนยันรหัสผ่าน"})
    password_verify:string
}