/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Post, Body, Get } from '@nestjs/common';
import { WebhookRequestBody } from '@line/bot-sdk';
import { environment } from './../../environments';
import { Client } from '@line/bot-sdk';
import axios from 'axios';
import { lab_models } from '@app/database/lab';

@Controller()
export class LineController {
    private readonly client: Client
    constructor() {
        this.client = new Client(environment.lineConfig)
    }

    @Post('webhook')
    async lineWebhook(@Body() { events }: WebhookRequestBody): Promise<any> {
        return await events.map(async (event) => {
            if (event.type === 'message') {
                return await this.replyEventMessage(event)
            }
            if (event.type === 'follow') {
                const profile = await this.client.getProfile(event.source.userId)
                const data = {
                    line_id: event.source.userId,
                    line_username: profile.displayName,
                    image: profile.pictureUrl,
                    type_user: 'user',
                }
                const isUser = await new lab_models.UserTb().where('line_id', data.line_id).fetch()
                if (isUser) {
                    return this.client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `สวัสดีคุณ ${data.line_username} ยินดีต้อนรับการกลับมาสู่ Q Khajorn`,
                    });
                }
                if (!isUser) {
                    const user = new lab_models.UserTb(data).save();
                    return this.client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: `สวัสดีคุณ ${data.line_username} ยินดีต้อนรับสู่ Q Khajorn ที่จะมาช่วยให้การจองตลาดนัด นั้นง่ายเพียงคลิก`,
                    });
                }
            }
        })
    }

    replyEventMessage(event) {
        const client = this.client;
        axios.get(`https://api.line.me/v2/bot/profile/${event.source.userId}`, {
            headers: {
                Authorization: `Bearer ${environment.lineConfig.channelAccessToken}`
            }
        })
            .then(function (response) {
                // handle success
                const displayName = response.data.displayName;
                if (event.type !== 'message' || event.message.type !== 'text') {
                    return Promise.resolve(null);
                }
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: `ต้องขอโทษ ${displayName} เนื่องจากระบบ Q Khajorn ยังไม่เปิดให้ใช้งาน chatbot ดังกล่างจึงไม่สามารถตอบกลับข้อความได้ ทางเราต้องขออภัย`,
                });
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
    }
}
