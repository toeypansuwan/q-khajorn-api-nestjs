/*
https://docs.nestjs.com/providers#services
*/

import { lab_connect, lab_models } from '@app/database/lab';
import { Injectable } from '@nestjs/common';
import { MarketFilterInput } from './dto/market.dto';

@Injectable()
export class MarketService {
    async getList(input: MarketFilterInput) {
        const marketModel = new lab_models.MarketTb();
        let sql = "(SELECT *,(((acos(sin((" + input.lat + "*pi()/180)) * sin((`lat`*pi()/180)) + cos((" + input.lat + "*pi()/180)) * cos((`lat`*pi()/180)) * cos(((" + input.lon + "- `lon`) * pi()/180)))) * 180/pi()) * 60 * 1.1515 * 1.609344)as distance FROM `market_tb`) AS v";
        marketModel.query().from(lab_connect.knex.raw(sql))
        if (input.min_price && input.max_price) {
            marketModel.query(q => {
                q.rightJoin('zone_tb', 'v.id', 'zone_tb.market_id');
                q.rightJoin('section_zone_tb', 'zone_tb.id', 'section_zone_tb.zone_id');
            })
            marketModel.where('price', '>=', input.min_price);
            marketModel.where('price', '<=', input.max_price);
        }
        if (input.distance) {
            marketModel.where('distance', '<=', input.distance)
        }
        if (input.search) {
            marketModel.where('v.name', 'like', `%${input.search}%`);
        }
        marketModel.query().select('v.id', 'v.name', 'v.image', 'v.time_open', 'v.time_close', 'v.lat', 'v.lon')
        return await marketModel.fetchAll();
    }

    async getPriceMinMax(input) {
        const marketModel = new lab_models.MarketTb();
        let sql = "(SELECT *,(((acos(sin((" + input.lat + "*pi()/180)) * sin((`lat`*pi()/180)) + cos((" + input.lat + "*pi()/180)) * cos((`lat`*pi()/180)) * cos(((" + input.lon + "- `lon`) * pi()/180)))) * 180/pi()) * 60 * 1.1515 * 1.609344)as distance FROM `market_tb`) AS v";
        marketModel.query().from(lab_connect.knex.raw(sql))
        marketModel.query(q => {
            q.rightJoin('zone_tb', 'v.id', 'zone_tb.market_id');
            q.rightJoin('section_zone_tb', 'zone_tb.id', 'section_zone_tb.zone_id');
        })
        marketModel.query().min('price as min').max('price as max');
        return await marketModel.fetch();
    }

    async getMarketID(id) {
        const marketModel = new lab_models.MarketTb();
        marketModel.query(q => {
            q.rightJoin('zone_tb', 'market_tb.id', 'zone_tb.market_id');
            q.rightJoin('section_zone_tb', 'zone_tb.id', 'section_zone_tb.zone_id');
            q.where('market_tb.id', id);
            q.select('market_tb.id', 'market_tb.image', 'market_tb.detail', 'market_tb.name', 'market_tb.time_open', 'market_tb.time_close', 'market_tb.detail').min('price as min')
        });

        return await marketModel.fetch({ withRelated: ['galleries', 'marketDays'] });
    }

    async getMarketPlan(id) {
        const marketModel = new lab_models.MarketTb();
        marketModel.query().select('image as image_plan').where('id', id)
        return await marketModel.fetch();
    }

    async getZone(id) {
        const zoneModel = new lab_models.ZoneTb();
        zoneModel.query().where('market_id', id);
        return await zoneModel.fetchAll({ columns: ["id", "name", "color", "width", "height", "pos_left", "pos_top"] });
    }
    async getCategoriesZone(id) {
        const zoneModel = new lab_models.ZoneTb();
        zoneModel.query(q => {
            q.leftJoin('zone_categories_tb', 'zone_tb.id', 'zone_categories_tb.zone_id');
            q.leftJoin('categories_tb', 'zone_categories_tb.category_id', 'categories_tb.id')
            q.where('zone_tb.market_id', id),
                q.select('categories_tb.name as category', 'zone_tb.id as zone_id')
        })
        return await zoneModel.fetchAll();
    }
}
