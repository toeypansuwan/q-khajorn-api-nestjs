/*
https://docs.nestjs.com/controllers#controllers
*/

import { MaxFileSizeValidator, FileTypeValidator, Controller, Get, Param, Post, Res, UseInterceptors, UploadedFile, ParseFilePipe, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { of } from 'rxjs';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { validMimeTypes, validMimeType } from './dto/upload.dto';
import { unlinkSync } from 'fs';
@Controller()
export class UploadController {
    @Get('market/:imageName')
    getImageMarket(@Param('imageName') image: string, @Res() res) {
        return of(res.sendFile(join(process.cwd(), `upload/market/${image}`)))
    }
    @Get('qr-code/:imageName')
    getImageReceipt(@Param('imageName') image: string, @Res() res) {
        return of(res.sendFile(join(process.cwd(), `upload/qr_code/${image}`)))
    }



    @Post('file')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './upload/market',
            filename(req, file, callback) {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                const fileExtension = extname(file.originalname)
                return callback(null, `kh_${randomName}${fileExtension}`);
            }
        }),
        limits: { fileSize: 1024 * 1024 * 2 },
        fileFilter(req, file, callback) {
            const allowedMimeTypes = validMimeTypes;
            allowedMimeTypes.includes(file.mimetype) ? callback(null, true) : callback(null, false)
        },
    }))
    uploadFile(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
                new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' })
            ]
        })
    ) image: Express.Multer.File) {
        // Save the file to the database or perform other actions here
        return { filename: image.filename };
    }

    @Delete('file/:filename')
    async deleteFile(@Param('filename') filename: string): Promise<{ message: string }> {
        const filePath = `./upload/market/${filename}`;
        try {
            unlinkSync(filePath); // delete the file synchronously
            return { message: 'File deleted successfully' };
        } catch (error) {
            throw new Error(`Could not delete file: ${error}`);
        }
    }
}
