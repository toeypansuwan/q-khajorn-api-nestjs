/*
https://docs.nestjs.com/controllers#controllers
*/

import { lab_models } from '@app/database/lab';
import { Body, Controller, Delete, Get, HttpException, Param, Post } from '@nestjs/common';
import { MarketService } from '../market/market.service';
import { CreateNotification, InputCreateDto } from './dto/order.dto';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
    constructor(
        private orderService: OrderService,
    ) { }
    @Post('create')
    async createOrder(@Body() input: InputCreateDto) {
        return await this.orderService.createOrder(input);
    }
    @Get(':id')
    async getOrderId(@Param('id') id: string) {
        return await this.orderService.getOrderId(id);
    }
    @Post('cancel/:id')
    async cancelOrder(@Param('id') id: string, @Body() input: { lineId: string }) {
        await this.orderService.checkOrderIsOrder(id, input.lineId);
        return await this.orderService.cancelOrder(id);
    }
    @Post('confirm/:id')
    async confirmOrder(@Param('id') id: string, @Body() input: { lineId: string }) {
        await this.orderService.checkOrderIsOrder(id, input.lineId);
        return await this.orderService.confirmOrder(id);
    }

    @Post('notification')
    async getNotificationOrder(@Body() input: { lineId: string; }) {
        const user = await new lab_models.UserTb().where('line_id', input.lineId).fetch();
        if (!user) {
            throw new Error("ไม่พบข้อมูลลูกค้า");
        }
        const notification = await new lab_models.Notification().where('line_id', input.lineId).where('status', 1).fetchAll({ columns: ['id', 'order_id', 'section_zone_id', 'date'] })
        return notification;
    }
    @Post('notification/:id')
    async notificationOrder(@Param('id') id: string, @Body() input: CreateNotification) {
        const user = await new lab_models.UserTb().where('line_id', input.lineId).fetch();
        if (!user) {
            throw new Error("ไม่พบข้อมูลลูกค้า");
        }
        return await this.orderService.notificationOrder(id, input);
    }
    @Delete('notification/:id/delete')
    async notificationOrderDelete(@Param('id') id: string) {
        const notification = await new lab_models.Notification().where('id', id).fetch();
        if (!notification) {
            throw new Error("ไม่พบบันทึกการแจ้งเตือน");
        }
        await notification.destroy();
        return {
            res_code: 200,
        };
    }

}
