import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, MinLength, ValidateNested } from "class-validator";
import type { Multer } from 'multer';
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export class marketInputCreate {
    // @IsNotEmpty({ message: 'กรุณากรอกรหัสตลาด' })
    // @MinLength(6, { message: "กรุณากรอก 6 ตัวขึ้นไป" })
    // key: string

    // @IsNotEmpty({ message: "กรุณากรอกชื่อ" })
    // @IsString()
    // name: string

    // @IsNotEmpty({ message: "กรุณากรอกชื่อ" })
    // image: File
    @IsString()
    market_name: string;

    @Type(() => ZoneDTO)
    @IsArray()
    @ValidateNested({ each: true })
    zones: ZoneDTO[];

    // image: UploadedFile;


}
class ZoneDTO {
    @IsString()
    name: string;

    // You can add more validation rules for the image property
    // image: UploadedFile;
}