import { LineService } from './line.service';
import { LineController } from './line.controller';
import * as line from '@line/bot-sdk'
/*
https://docs.nestjs.com/modules
*/

import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { environment } from '@app/environments';

@Module({
    imports: [],
    controllers: [
        LineController,],
    providers: [
        LineService,],
})
export class LineModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(line.middleware(environment.lineConfig))
            .forRoutes("webhook");
    }
}
