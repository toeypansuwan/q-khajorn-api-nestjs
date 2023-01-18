/*
https://docs.nestjs.com/providers#services
*/
import * as moment from 'moment';
import * as crypto from 'crypto';
import axios from 'axios';
import { lab_connect, lab_models } from '@app/database/lab';
import { ZoneTb } from '@app/database/lab/zone_tb';
import { HttpException, Injectable } from '@nestjs/common';
import { InputCreateDto } from './dto/order.dto';
import { environment } from '@app/environments';


@Injectable()
export class OrderService {
    async createOrder(input: InputCreateDto) {
        const marketModel = await new lab_models.MarketTb().where('id', input.market_id).fetch();
        const zoneModel = await new lab_models.ZoneTb().where('id', input.zone_id).fetch();
        const userModel = await new lab_models.UserTb().where('line_id', input.line_id).fetch();
        const orderSectionModel = await new lab_models.OrderSectionZoneTb()
        const startOfWeek = moment().startOf('month').format('YYYY-MM-DD');
        const endOfWeek = moment().endOf('month').format('YYYY-MM-DD');
        const countOrderOfMonth = await new lab_models.OrderTb().query(q => {
            q.count('* as count')
            q.whereBetween('created_at', [startOfWeek, endOfWeek])
        }).fetch();
        const count = countOrderOfMonth?.get('count').toString().padStart(5, '0');
        const uniqueCode = crypto.randomBytes(6).toString('hex');
        const date = moment(new Date()).format("YYYYMMDD");
        let totolPrice = 0;
        let service_price = 0;
        const orderData = {
            market_id: marketModel?.get('id'),
            market_name: marketModel?.get('name'),
            order_runnumber: `${count}-${date}-${marketModel.id}-${uniqueCode}`,
            user_id: userModel?.get('id'),
            user_name: userModel?.get('line_username'),
            zone_id: zoneModel?.get('id'),
            zone_name: zoneModel?.get('name'),
            service: input.service,
            price: 0,
            status_pay: "success",
        }
        for (const [key, value] of Object.entries(orderData)) {
            if (value === null || value === undefined) {
                throw new HttpException(`ไม่พบ ${key}`, 404)
            }
        }
        if (input.service == 1) {
            service_price = marketModel?.get('service_price');
        }
        const { sections, appliances } = input;
        for (const section of sections) {
            //check day open
            for (const day of section.days) {
                const dayname = moment(day, 'YYYY-MM-DD').format("dddd")
                const marketDaysModel = await new lab_models.MarketDaysTb().query(q => {
                    q.where('market_id', orderData.market_id)
                    q.where('dayname', dayname)
                }).fetch();
                if (!marketDaysModel) {
                    throw new HttpException(`${dayname}ไม่ใช่วันเปิดตลาด`, 405)
                }
            }
            //check free section from date
            const sectionClone = await orderSectionModel.query(q => {
                q.select('order_section_zone_tb.section_zone_name as name', 'order_section_zone_day_tb.date as date')
                q.innerJoin('order_tb', 'order_tb.id', 'order_section_zone_tb.order_id')
                q.innerJoin('order_section_zone_day_tb', 'order_section_zone_day_tb.order_section_zone_id', 'order_section_zone_tb.id')
                q.andWhere('order_section_zone_tb.section_zone_id', section.id);
                q.whereIn('order_section_zone_day_tb.date', section.days);
            }).fetchAll();
            if (sectionClone.length > 0) {
                sectionClone.forEach(i => {
                    throw new HttpException(`${moment(i.get('date')).format("YYYY-MM-DD")} แผง ${i.get('name')} ถูกจองแล้ว`, 405)
                })
            }
        }
        for (const appliance of input.appliances) {
            const applianceModel = await new lab_models.AccessoriesTb().query(q => {
                q.where('market_id', orderData.market_id)
                q.where('id', appliance.id)
            }).fetch()
            if (!applianceModel) {
                throw new HttpException("ไม่พบ appliance", 405)
            }
        }

        //create order
        const orderModel = await new lab_models.OrderTb()
        const orderModelSave = await orderModel.clone().save(orderData);
        let appliancePrice = 0;
        for (const appliance of appliances) {
            const applianceModel = await new lab_models.AccessoriesTb().where('id', appliance.id).fetch()
            if (applianceModel) {
                const applianceData = {
                    order_id: orderModelSave.id,
                    assessory_id: appliance.id,
                    quantity: Number(appliance.amount),
                    price: Number(applianceModel.get('price')) * Number(appliance.amount)
                }
                appliancePrice += applianceData.price;
                await new lab_models.OrderAccessoryTb().save(applianceData)
            }
        }
        for (const section of sections) {
            const sectionModel = await new lab_models.SectionZoneTb().where('id', section.id).fetch()
            const orderSectionModel = await new lab_models.OrderSectionZoneTb().save({
                section_zone_id: section.id,
                section_zone_name: sectionModel.get('name'),
                order_id: orderModelSave.id,
                price: Number(sectionModel.get('price'))
            })
            for (const day of section.days) {
                await new lab_models.OrderSectionZoneDayTb().save({
                    order_section_zone_id: orderSectionModel.id,
                    date: moment(day).format("YYYY-MM-DD"),
                    day: moment(day).format("dddd"),
                })
                totolPrice += Number(sectionModel.get('price')) + appliancePrice + service_price
            }
        }
        const order = await orderModel.where('id', orderModelSave.id).fetch()
        await order.save({
            price: totolPrice,
        }, { patch: true, method: 'update' })
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment.lineConfig.channelAccessToken}`
            }
        }
        const data = {
            to: input.line_id,
            messages: [
                {
                    type: "text",
                    text: `การจองของคุณเรียบร้อยแล้วหมายเลขการจอง: ${orderData.order_runnumber}`
                },
                {
                    type: "image",
                    originalContentUrl: `${environment.API_URL}upload/market/receipt_demo.png`,
                    previewImageUrl: `${environment.API_URL}upload/market/receipt_demo.png`
                }
            ]
        }
        axios.post(`https://api.line.me/v2/bot/message/push`, data, config).then(res => {
            console.log(res)
        }).catch(err => {
            console.error(err.response.data)
        })
        return {
            "res_code": 200,
            "message": "success"
        }
    }

}
