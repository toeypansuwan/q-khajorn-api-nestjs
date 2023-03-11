/*
https://docs.nestjs.com/providers#services
*/

import { lab_connect, lab_models } from '@app/database/lab';
import { AccessoriesTb } from '@app/database/lab/accessories_tb';
import { environment } from '@app/environments';
import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from 'bluebird';
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

    async getPlan(id, plan) {
        let model;
        if (plan == "market") {
            model = new lab_models.MarketTb();
            model.query().select('image_plan').where('id', id)
        } else if (plan == "zone") {
            model = new lab_models.ZoneTb();
            model.query().select('image_plan').where('id', id)
        } else {
            throw new HttpException("ไม่พบ Plan", 404)
        }
        return await model.fetch();
    }

    async getZone(id, input?) {
        const zoneModel = new lab_models.ZoneTb();
        zoneModel.query(q => {
            q.leftJoin('zone_categories_tb', 'zone_tb.id', 'zone_categories_tb.zone_id')
            if (input?.category_id) {
                zoneModel.where('zone_categories_tb.category_id', input.category_id)
            }
            q.select('zone_tb.id', 'zone_tb.name', 'zone_tb.color', 'zone_tb.shape').where('zone_tb.market_id', id)
        })

        const zone = await zoneModel.fetchAll({ withRelated: ['points'] })
        return zone;
    }
    async getCategoriesZone(id) {
        const zoneModel = new lab_models.ZoneTb();
        zoneModel.query(q => {
            q.leftJoin('zone_categories_tb', 'zone_tb.id', 'zone_categories_tb.zone_id');
            q.leftJoin('categories_tb', 'zone_categories_tb.category_id', 'categories_tb.id')
            q.where('zone_tb.market_id', id),
                q.select('categories_tb.name as category', 'categories_tb.id as id')
        })
        return await zoneModel.fetchAll();
    }

    async getDays(id) {
        const marketID = await new lab_models.ZoneTb().where('id', id).fetch({ columns: ['market_id as id'] });
        const marketModel = new lab_models.MarketDaysTb();
        marketModel.where('market_id', marketID.id)
        return await marketModel.fetchAll({ columns: ['dayname'] })
    }

    async getSection(id, input?) {
        const orderSectionZoneModel = new lab_models.OrderSectionZoneTb();
        const sql = "CASE WHEN order_section_zone_day_tb.id IS NULL OR order_tb.status_pay = 'fail' THEN 'rgba(88, 202, 69, 0.5)' WHEN order_tb.status_pay = 'wait' THEN 'rgba(250, 207, 67, 0.5)' ELSE 'rgba(230, 230, 230, 0.5)' END as color, CASE WHEN order_section_zone_day_tb.id IS NULL OR order_tb.status_pay ='fail' THEN true WHEN order_tb.status_pay = 'wait' THEN 2  ELSE false END as status, CASE WHEN order_tb.status_pay = 'wait' THEN order_tb.id END as order_id";
        orderSectionZoneModel.query(q => {
            q.innerJoin(`order_section_zone_day_tb`, `order_section_zone_day_tb.order_section_zone_id`, `order_section_zone_tb.id`)
            q.innerJoin(`order_tb`, `order_tb.id`, `order_section_zone_tb.order_id`)
            q.rightJoin(`section_zone_tb`, (j) => {
                j.on(`section_zone_tb.id`, `=`, `order_section_zone_tb.section_zone_id`)
                j.andOn(lab_connect.knex.raw(`order_section_zone_day_tb.date = '${input.date}'`))
            })
            q.where(`section_zone_tb.zone_id`, id)
            q.select(`section_zone_tb.id`, `section_zone_tb.name`, `section_zone_tb.price`, `section_zone_tb.zone_id`, `section_zone_tb.shape`, lab_connect.knex.raw(sql), 'section_zone_tb.image')
        })
        const section = await orderSectionZoneModel.fetchAll({ withRelated: ['points'] })

        return section;
    }
    async getAppliance(id) {
        const accessoriesModel = new lab_models.AccessoriesTb();
        const zone = await new lab_models.ZoneTb().where('id', id).fetch();
        if (!zone)
            throw new HttpException("ไม่พบ zone", 404);
        const data = accessoriesModel.where('market_id', zone.get('market_id')).fetchAll({ columns: ['id', 'name', 'price', 'quantity', 'image'] })
        return data;
    }
    async getServicePrice(id) {
        const marketModel = new lab_models.MarketTb();
        const data = marketModel.where('id', id).fetch({ columns: ['id', 'service_price as price'] })
        return data;
    }

}
