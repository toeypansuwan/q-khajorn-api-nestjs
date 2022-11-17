/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post, Body, Get } from '@nestjs/common';
import { WebhookRequestBody } from '@line/bot-sdk';
import { environment } from './../../environments';
import * as line from '@line/bot-sdk';
import axios from 'axios';

@Controller()
export class LineController {
    constructor(
        // private readonly lineHandleEvent: LineHandleEvent
    ) { }
    @Get('')
    getHello() {
        return "Hello AAAAAAAA"
    }

    @Post('webhook')
    async lineWebhook(@Body() { events }: WebhookRequestBody): Promise<any> {
        const client = new line.Client(environment.lineConfig);
        return events.map((event) => {
            let displayName = "";
            axios.get(`https://api.line.me/v2/bot/profile/${event.source.userId}`, {
                headers: {
                    Authorization: `Bearer ${environment.lineConfig.channelAccessToken}`
                }
            })
                .then(function (response) {
                    // handle success
                    displayName = response.data.displayName;
                    if (event.type !== 'message' || event.message.type !== 'text') {
                        return Promise.resolve(null);
                    }
                    return client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `สวัสดีครับ ${displayName} ยินดีต้อนรับสู่ Q Khajorn`,
                    });
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                })
        })
    }
}
