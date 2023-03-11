import { IsNotEmpty, IsString } from "class-validator"

export class LineId {
    @IsString()
    @IsNotEmpty({ message: "กรุณากรอก latitude" })
    lineId: string
    @IsString()
    @IsNotEmpty({ message: "กรุณากรอก latitude" })
    key: string
}