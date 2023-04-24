/*
https://docs.nestjs.com/controllers#controllers
*/

import { lab_models } from '@app/database/lab';
import { Body, Controller, Get, Param, Post, Query, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { MarketFilterInput, Location, Section, KeywordMarket, VerifyKeyInput } from './dto/market.dto';
import { MarketInputCreate } from './dto/marketCreate.dto';
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

    @Get('/:id/appliance')
    getApplianceMarket(@Param('id') id: string) {
        return this.marketService.getAppliance(id);
    }
    @Get('/:id/service-price')
    getServicePrice(@Param('id') id: string) {
        return this.marketService.getServicePrice(id);
    }

    @Get('')
    async getAllMarket(@Query('keyword') keyword: KeywordMarket) {
        const marketModel = new lab_models.MarketTb();
        if (keyword)
            marketModel.where("name", 'LIKE', `%${keyword}%`)

        return await marketModel.fetchAll({ columns: ['id', 'name', 'image'] });
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-key')
    async verifyKey(@Body() input: VerifyKeyInput) {
        const isMarket = await this.marketService.verifyKey(input)
        if (isMarket) {
            return {};
        }
        return {
            res_code: 200
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('/create')
    async createMarket(@Body() marketInputCreate: MarketInputCreate) {
        // Save market to database
        return await this.marketService.createMarket(marketInputCreate);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/delete/:id')
    async deleteMarket(@Param('id') id: string) {
        // Save market to database
        return await this.marketService.destroyMarket(id);
    }
}

