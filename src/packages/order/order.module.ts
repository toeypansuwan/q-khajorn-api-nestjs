import { OrderService } from './order.service';
import { OrderController } from './order.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { MarketService } from '../market/market.service';

@Module({
    imports: [],
    controllers: [
        OrderController,],
    providers: [
        OrderService, MarketService],
})
export class OrderModule { }
