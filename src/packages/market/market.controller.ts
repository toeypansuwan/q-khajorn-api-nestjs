/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MarketFilterInput, Location } from './dto/market.dto';
import { MarketService } from './market.service';

@Controller()
export class MarketController {
    constructor(private marketService: MarketService) { }
    @Post('list-filter')
    getMarket(@Body() input: MarketFilterInput) {
        return this.marketService.getList(input);
    }

    @Get('min-max/price')
    get(@Query() input: Location) {
        return this.marketService.getPriceMinMax(input);
    }

    @Get(':id')
    getProfile(@Param('id') id: string) {
        return this.marketService.getMarketID(id);
    }
}
