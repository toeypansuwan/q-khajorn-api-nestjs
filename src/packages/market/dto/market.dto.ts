import { IsNotEmpty, IsNumber } from "class-validator"

export class MarketFilterInput {
    search: string
    status: string

    @IsNotEmpty({ message: "กรุณากรอก latitude" })
    lat: string
    @IsNotEmpty({ message: "กรุณากรอก longitude" })
    lon: string
    // @IsNumber({}, { message: "กรุณากรอกจำนวนเงินสูงสุดเป็นตัวเลข" })
    max_price: string
    // @IsNumber({}, { message: "กรุณากรอกจำนวนเงินต่ำเป็นตัวเลข" })
    min_price: string
    // @IsNumber({}, { message: "กรุณากรอกจำนวนเงินต่ำเป็นตัวเลข" })
    distance: string
}