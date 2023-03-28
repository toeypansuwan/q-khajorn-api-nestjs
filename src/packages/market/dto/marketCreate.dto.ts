import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsDecimal, IsIn, IsNotEmpty, IsNumber, IsString, MinLength, ValidateNested } from "class-validator";
import type { Multer } from 'multer';


export class MarketInputCreate {
    @IsNotEmpty({ message: 'กรุณากรอกรหัสตลาด' })
    @MinLength(6, { message: "กรุณากรอก 6 ตัวขึ้นไป" })
    key: string

    @IsNotEmpty({ message: "กรุณากรอกชื่อ" })
    @IsString()
    name: string

    @IsNotEmpty({ message: "กรุณาเพิ่มภาพตลาด" })
    @IsString()
    image: string

    @IsNotEmpty({ message: "กรุณากรอกเวลาเปิด" })
    @IsString()
    time_open: string;

    @IsNotEmpty({ message: "กรุณากรอกเวลาปิด" })
    @IsString()
    time_close: string;

    @IsNotEmpty({ message: "กรุณากรอกละติจูด" })
    @IsString()
    lat: string;

    @IsNotEmpty({ message: "กรุณากรอกลองจิจูด" })
    @IsString()
    lon: string;

    @IsNotEmpty({ message: "กรุณากรอกข้อมูลตลาด" })
    @IsString()
    detail: string;

    @IsNotEmpty({ message: "กรุณาเพิ่มภาพผังตลาด" })
    @IsString()
    image_plan: string;

    @IsNotEmpty({ message: "กรุณากรอกค่าบริการไฟฟ้า" })
    @IsNumber()
    service_price: number;

    @IsNotEmpty({ message: "กรุณากรอกเบอร์" })
    @IsString()
    mobile_number: string;

    @IsNotEmpty({ message: "กรุณารหัสบัตรประชาชน" })
    @IsString()
    id_card_number: string

    @IsArray()
    @IsIn(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], {
        each: true, message(validationArguments) {
            return `สามารถกรอกได้แค่ ${validationArguments.constraints.toString()}`
        },
    })
    daysname: Array<string>

    @IsArray()
    galleries: Array<string>

    @IsArray()
    @Type(() => CategoryDto)
    @ValidateNested({ each: true })
    // @ArrayUnique((item: CategoryDto) => item.id)
    categories: Array<CategoryDto>

    @Type(() => ZoneDTO)
    @IsArray()
    @ValidateNested({ each: true })
    zones: Array<ZoneDTO>

    @Type(() => AccessoryDto)
    @IsArray()
    @ValidateNested({ each: true })
    accessories: Array<AccessoryDto>
}
export class CategoryDto {
    // @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string
}
export class ZoneDTO {
    @IsNotEmpty({ message: "กรุณากรอกชื่อ" })
    @IsString()
    name: string;

    @IsNotEmpty({ message: "กรุณากรอกค่าสี" })
    @IsString()
    color: string;

    @IsNotEmpty({ message: "กรุณาใส่รูป" })
    @IsString()
    image_plan: string

    @IsNotEmpty({ message: "กรุณาเลือกรูปร่าง" })
    @IsString()
    shape: string

    @IsArray()
    @Type(() => CategoryDto)
    @ValidateNested({ each: true })
    // @ArrayUnique((item: CategoryDto) => item.id)
    categories: Array<CategoryDto>

    @IsArray()
    @Type(() => PointDto)
    @ValidateNested({ each: true })
    points: Array<PointDto>

    @IsArray()
    @Type(() => SectionDto)
    @ValidateNested({ each: true })
    sections_zone: Array<SectionDto>
}

export class PointDto {
    @IsNumber()
    @IsNotEmpty()
    axis_x: number

    @IsNumber()
    @IsNotEmpty()
    axis_y: number
}

export class SectionDto {
    @IsNotEmpty({ message: "กรุณากรอกชื่อแผง" })
    @IsString()
    name: string

    @IsNotEmpty({ message: "กรุณากรอกราคาแผง" })
    @IsNumber()
    price: number

    @IsNotEmpty({ message: "กรุณาเลือกสถานะแผง" })
    status: string

    @IsNotEmpty({ message: "กรุณาเลือกรูปร่างแผง" })
    @IsString()
    shape: string

    @IsNotEmpty({ message: "กรุณาใส่รูปแผง" })
    @IsString()
    image: string

    @Type(() => PointDto)
    @IsArray()
    @ValidateNested({ each: true })
    points: Array<PointDto>
}

export class AccessoryDto {
    @IsNotEmpty({ message: "กรุณากรอกชื่ออุปกรณ์" })
    @IsString()
    name: string

    @IsNotEmpty({ message: "กรุณากรอกราคาอุปกรณ์" })
    @IsNumber()
    price: number

    @IsNotEmpty({ message: "กรุณากรอกใส่รูป" })
    @IsString()
    image: string
}