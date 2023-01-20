/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Post } from '@nestjs/common';
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
        return this.orderService.createOrder(input);
    }

}
