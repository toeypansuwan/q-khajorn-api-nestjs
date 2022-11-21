import { UploadController } from './upload.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [
        UploadController,],
    providers: [],
})
export class UploadModule {
}
