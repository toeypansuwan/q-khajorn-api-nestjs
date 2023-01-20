/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';
import { of } from 'rxjs';

@Controller()
export class UploadController {
    @Get('market/:imageName')
    getImageMarket(@Param('imageName') image: string, @Res() res) {
        return of(res.sendFile(join(process.cwd(), `upload/market/${image}`)))
    }
    @Get('receipt/:imageName')
    getImageReceipt(@Param('imageName') image: string, @Res() res) {
        return of(res.sendFile(join(process.cwd(), `upload/receipt/${image}`)))
    }
}
