/*
https://docs.nestjs.com/providers#services
*/
import * as moment from 'moment';
import * as crypto from 'crypto';
import axios from 'axios';
import { lab_connect, lab_models } from '@app/database/lab';
import { HttpException, Injectable } from '@nestjs/common';
import { InputCreateDto } from './dto/order.dto';
import { environment } from '@app/environments';
import nodeHtmlToImage from 'node-html-to-image'
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
        const htmlElems = {
            product: ``,
            other: ``
        }
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
            htmlElems.other += `<tr id="other">
            <td>บริการไฟฟ้า</td>
            <td class="text-end">${service_price}</td>
        </tr>`
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
                htmlElems.other += `<tr id="other">
        <td>${applianceModel.get('name')}*${appliance.amount}</td>
        <td class="text-end">${applianceData.price}</td>
    </tr>`
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
        await order.clone().save({
            price: totolPrice,
        }, { patch: true, method: 'update' })
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment.lineConfig.channelAccessToken}`
            }
        }
        const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet"
                integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
            <style>
                body {
                    width: 300px;
                    background: #FFFFFF;
                    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.25);
                    border-radius: 5px;
                    color: #717171;
                    font-size: 12px;
                }
        
                .bg-logo {
                    background: no-repeat center/100% url('http://localhost:3100/api/v1/upload/market/logo_water.png');
                    width: 130px;
                }
        
                .fs-10 {
                    font-size: 10px;
                }
        
                .fs-24 {
                    font-size: 24px;
                }
            </style>
        </head>
        
        <body>
            <div class="p-3">
                <div class="mx-auto text-center bg-logo mx-3 mb-3">
                    <h1 class="fs-24" id="market_name">${orderData.market_name}</h1>
                    <p class="fs-10" id="market_address">ต.บางเค็ม อ.เขาย้อย จ.เพชรบุรี 76140</p>
                </div>
                <p class="text-break mb-0">
                    Order: <span id="order">${orderData.order_runnumber}</span><br>
                    ชื่อลูกค้า <span id="name">${orderData.user_name}</span><br>
                    lineID: <span id="line_id">${input.line_id}</span><br>
                    วันที่: <span id="date">${moment(order.get('created_at'), "YYYY-MM-DD").locale('th').add(543, 'years').format("dd D MMM YYYY")}</span>
                </p>
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">รายการ</th>
                            <th scope="col">วันที่จอง</th>
                            <th scope="col" class="text-end">ราคา</th>
                        </tr>
                    </thead>
                    <tbody class="table-group-divider">
                        <tr id="product">
                            <td>Mark</td>
                            <td>Otto</td>
                            <td class="text-end">@mdo</td>
                        </tr>
                    </tbody>
                </table>
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">รายการ</th>
                            <th scope="col" class="text-end">ราคา</th>
                        </tr>
                    </thead>
                    <tbody class="table-group-divider">
                        ${htmlElems.other}
                        <tr>
                            <td class="fw-bolder">รวม</td>
                            <td id="total" class="text-end fw-bolder">${totolPrice}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex">
                    <span class="me-auto">ใบเสร็จรับเงิน/ใบกำกับภาษี </span>
                    <span>ออกโดย: Q Khajorn</span>
                </div>
        
            </div>
        </body>
        
        </html>`;

        nodeHtmlToImage({
            output: `./upload/receipt/${orderData.order_runnumber}.png`,
            html
        }).then(() => {
            const data = {
                to: input.line_id,
                messages: [
                    {
                        type: "text",
                        text: `การจองของคุณเรียบร้อยแล้วหมายเลขการจอง: ${orderData.order_runnumber}`
                    },
                    {
                        type: "image",
                        originalContentUrl: `${environment.API_URL}upload/receipt/${orderData.order_runnumber}.png`,
                        previewImageUrl: `${environment.API_URL}upload/receipt/${orderData.order_runnumber}.png`
                    }
                ]
            }
            axios.post(`https://api.line.me/v2/bot/message/push`, data, config).then(res => {
                console.log(res.data)
            }).catch(err => {
                console.error(err.response.data)
            })
        }
        )
        return {
            "res_code": 200,
            "message": "success"
        }
    }
}