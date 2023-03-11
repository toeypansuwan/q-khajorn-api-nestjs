import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsDateString, IsIn, IsNotEmpty, IsNumber, IsString, registerDecorator, Validate, ValidateIf, ValidateNested, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator"

@ValidatorConstraint({ name: 'string-or-number', async: false })
export class IsNumberOrString implements ValidatorConstraintInterface {
    validate(text: any, args: ValidationArguments) {
        return typeof text === 'number' || typeof text === 'string';
    }

    defaultMessage(args: ValidationArguments) {
        return `ค่า ${args.property}:${JSON.stringify(args.value)} ไม่ใช่ number หรือ string`;
    }
}

export class InputCreateDto {
    @IsNotEmpty({ message: "line_id กรุณากรอก" })
    @IsString({
        message: "ค่า line_id ต้องเป็น string เท่านั้น"
    })
    line_id: string;

    @IsNotEmpty({ message: "market_id กรุณากรอก" })
    @Validate(IsNumberOrString)
    market_id: number | string;

    @IsNumber({}, {
        message: "ค่า service ต้องเป็น number เท่านั้น"
    })
    service: number;

    @IsNotEmpty({ message: "zone_id กรุณากรอก" })
    @Validate(IsNumberOrString)
    zone_id: number | string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Section)
    @ArrayNotEmpty({ message: "กรุณาเลือกแผงก่อนสร้าง Order" })
    sections: Section[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Appliance)
    appliances: Appliance[];
}

export class Section {
    @IsNotEmpty()
    @Validate(IsNumberOrString)
    id: number | string;

    @IsArray()
    @ArrayNotEmpty({ message: "กรุณาเลือกวันที่จองแผง" })
    days: string[];
}

export class Appliance {
    @IsNotEmpty()
    @Validate(IsNumberOrString)
    id: number | string;

    @IsNotEmpty()
    @Validate(IsNumberOrString)
    amount: number | string;
}

export class CreateNotification {
    @IsNotEmpty()
    lineId: string;

    @IsNotEmpty()
    id: number | string;

    @IsNotEmpty()
    @IsDateString()
    date: string
}