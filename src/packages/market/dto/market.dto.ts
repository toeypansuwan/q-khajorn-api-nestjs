import { IsDateString, IsNotEmpty, IsOptional, IsString, Min, MinLength } from "class-validator"

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

export class Location {
    @IsNotEmpty({ message: "กรุณากรอก latitude" })
    lat: string
    @IsNotEmpty({ message: "กรุณากรอก longitude" })
    lon: string
}
export class Section {
    @IsNotEmpty({ message: "กรุณาระบุวันที่" })
    @IsDateString({ message: "กรุณาระบุเป็น Date" })
    date: string
}

export class KeywordMarket {
    @IsOptional()
    @IsString({ message: "keyword ไม่เป็นตัวอักษร" })
    keyword: string
}

export class VerifyKeyInput {
    @IsNotEmpty({ message: 'กรุณากรอกรหัสตลาด' })
    @MinLength(6, { message: "กรุณากรอก 6 ตัวขึ้นไป" })
    key: string
}