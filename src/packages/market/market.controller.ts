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
    getMinMaxPrice(@Query() input: Location) {
        return this.marketService.getPriceMinMax(input);
    }

    @Get(':id')
    getProfile(@Param('id') id: string) {
        return this.marketService.getMarketID(id);
    }
    @Get('/:id/image-plan')
    getImagePlan(@Param('id') id: string) {
        return this.marketService.getMarketPlan(id);
    }

    @Get('/:id/zone')
    getZoneMarket(@Param('id') id: string) {
        return this.marketService.getZone(id);
    }
    @Get('/:id/zone-categories')
    getZoneCategoriesMarket(@Param('id') id: string) {
        return this.marketService.getCategoriesZone(id);
    }
}
