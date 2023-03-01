/*
https://docs.nestjs.com/controllers#controllers
*/

import { lab_models } from '@app/database/lab';
import { Body, Controller, Get, HttpException, Param, Post } from '@nestjs/common';
import { MarketService } from '../market/market.service';
import { InputCreateDto } from './dto/order.dto';
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

}
