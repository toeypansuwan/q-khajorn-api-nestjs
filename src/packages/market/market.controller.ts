/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MarketFilterInput, Location, Section } from './dto/market.dto';
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
    @Get('/:id/image-plan-market')
    getImagePlanMarket(@Param('id') id: string) {
        return this.marketService.getPlan(id, "market");
    }
    @Get('/:id/image-plan-zone')
    getImagePlanZone(@Param('id') id: string) {
        return this.marketService.getPlan(id, "zone");
    }

    @Post('/:id/zone')
    getZoneMarket(@Param('id') id: string, @Body() input: any) {
        return this.marketService.getZone(id, input);
    }
    @Get('/:id/zone-categories')
    getZoneCategoriesMarket(@Param('id') id: string) {
        return this.marketService.getCategoriesZone(id);
    }

    @Get('/:id/open-days')
    async getDaysOpen(@Param('id') id: string) {
        return this.marketService.getDays(id);
    }
    @Post('/:id/section')
    getSectionMarket(@Param('id') id: string, @Body() input: Section) {
        return this.marketService.getSection(id, input);
    }
}
