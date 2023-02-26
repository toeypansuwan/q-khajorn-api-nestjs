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
import { scheduleJob } from 'node-schedule';
import * as generatePayload from 'promptpay-qr';
import * as qrcode from 'qrcode';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
    private jobs = new Map<string, any>();
    private confirmedOrders = new Set<string>();

    async createOrder(input: InputCreateDto) {
        const marketModel = await new lab_models.MarketTb().where('id', input.market_id).fetch();
        const zoneModel = await new lab_models.ZoneTb().where('id', input.zone_id).fetch();
        const userModel = await new lab_models.UserTb().where('line_id', input.line_id).fetch();
        const orderSectionModel = new lab_models.OrderSectionZoneTb();
        const startOfWeek = moment().startOf('month').format('YYYY-MM-DD');
        const endOfWeek = moment().endOf('month').format('YYYY-MM-DD');
        const countOrderOfMonth = await new lab_models.OrderTb().query(q => {
            q.count('* as count')
            q.whereBetween('created_at', [startOfWeek, endOfWeek])
        }).fetch();
        // const count = countOrderOfMonth?.get('count').toString().padStart(5, '0');
        const uniqueCode = crypto.randomBytes(6).toString('hex');
        const date = moment(new Date()).format("YYYYMMDD");

        const orderData = {
            market_id: marketModel?.get('id'),
            market_name: marketModel?.get('name'),
            // order_runnumber: `${count}-${date}-${marketModel.id}-${uniqueCode}`,
            order_runnumber: `KJ-${date}-${uniqueCode}`,
            user_id: userModel?.get('id'),
            user_name: userModel?.get('line_username'),
            zone_id: zoneModel?.get('id'),
            zone_name: zoneModel?.get('name'),
            service: input.service,
            price: 0,
            status_pay: "wait",
        }
        for (const [key, value] of Object.entries(orderData)) {
            if (value === null || value === undefined) {
                throw new HttpException(`ไม่พบ ${key}`, 404)
            }
        }
        const { sections, appliances } = input;
        let counterDays = 0;
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
                counterDays += 1;
            }
            //check free section from date
            const sectionClone = await orderSectionModel.query(q => {
                q.select('order_section_zone_tb.section_zone_name as name', 'order_tb.status_pay as status', 'order_section_zone_day_tb.date as date')
                q.innerJoin('order_tb', 'order_tb.id', 'order_section_zone_tb.order_id')
                q.innerJoin('order_section_zone_day_tb', 'order_section_zone_day_tb.order_section_zone_id', 'order_section_zone_tb.id')
                q.andWhere('order_section_zone_tb.section_zone_id', section.id);
                q.whereIn('order_section_zone_day_tb.date', section.days);
            }).fetchAll();
            if (sectionClone.length > 0) {
                sectionClone.forEach(i => {
                    if (i.get('status') != 'fail') {
                        throw new HttpException(`${moment(i.get('date')).format("YYYY-MM-DD")} แผง ${i.get('name')} ถูกจองแล้ว`, 405)
                    }
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
        const dataRecipt = {
            product: [],
            other: [],
            totolPrice: 0,
            service_price: 0,
        }
        const orderModel = new lab_models.OrderTb()
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
                if (input.appliances.length > 0) {
                    // dataRecipt.other.push(
                    //     dataRecipt.other.push(this.createContentOther());
                    // );
                    // htmlElems.other += `
                    // <tr>
                    //     <td>${appliance.amount}</td>
                    //     <td>${applianceModel.get('name')}</td>
                    //     <td>${applianceModel.get('price')}</td>
                    //     <td>x${input.sections.length}</td>
                    //     <td class="text-end">${applianceData.price}</td>
                    // </tr>`
                }
                appliancePrice += applianceData.price;
                await new lab_models.OrderAccessoryTb().save(applianceData)
            }
        }
        if (input.service == 1) {
            dataRecipt.service_price = marketModel?.get('service_price');
            // htmlElems.other += `<tr>
            //     <td>1</td>
            //     <td>บริการไฟฟ้า</td>
            //     <td>${dataRecipt.service_price}</td>
            //     <td>x${counterDays}</td>
            //     <td class="text-end">${dataRecipt.service_price * counterDays}</td>
            // </tr>`
        }
        for (const section of sections) {
            const sectionModel = await new lab_models.SectionZoneTb().where('id', section.id).fetch()
            const orderSectionModel = await new lab_models.OrderSectionZoneTb().save({
                section_zone_id: section.id,
                section_zone_name: sectionModel.get('name'),
                order_id: orderModelSave.id,
                price: Number(sectionModel.get('price'))
            })
            // dataRecipt.product.push(this.createSectionBox(sectionModel, section));
            for (const day of section.days) {
                await new lab_models.OrderSectionZoneDayTb().save({
                    order_section_zone_id: orderSectionModel.id,
                    date: moment(day).format("YYYY-MM-DD"),
                    day: moment(day).format("dddd"),
                })
                dataRecipt.totolPrice += Number(sectionModel.get('price')) + appliancePrice + dataRecipt.service_price
            }
        }
        const order = await orderModel.where('id', orderModelSave.id).fetch()
        const accountNumber = marketModel.get('mobile_number') || marketModel.get('id_card_number')
        const amount = dataRecipt.totolPrice;
        const payload = generatePayload(accountNumber, { amount }) //First parameter : mobileNumber || IDCardNumber
        // Convert to SVG QR Code
        const updateData = {
            price: dataRecipt.totolPrice,
            qr_code: ''
        }
        const options = { type: 'svg', color: { dark: '#000', light: '#fff' } }
        qrcode.toString(payload, options, (err, svg) => {
            if (err) {
                throw new Error(`qrcode: ${err}`);
            }
            const fileName = `QRcode_${uuidv4()}.svg`;
            this.writeFile(`./upload/qr_code/${fileName}`, svg)
            updateData.qr_code = fileName;
        })
        await order.clone().save(updateData, { patch: true, method: 'update' })

        // const html = `<!DOCTYPE html>
        // <html lang="en">
        // <head>
        //     <meta charset="UTF-8">
        //     <meta http-equiv="X-UA-Compatible" content="IE=edge">
        //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //     <title>Document</title>
        //     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet"
        //         integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
        //     <style>
        //         body {
        //             width: 300px;
        //             background: #FFFFFF;
        //             box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.25);
        //             border-radius: 5px;
        //             color: #717171;
        //             font-size: 12px;
        //         }

        //         .bg-logo {
        //             background: no-repeat center/100% url('http://localhost:3100/api/v1/upload/market/logo_water.png');
        //             width: 130px;
        //         }

        //         .fs-10 {
        //             font-size: 10px;
        //         }

        //         .fs-24 {
        //             font-size: 24px;
        //         }
        //     </style>
        // </head>

        // <body>
        //     <div class="p-3">
        //         <div class="mx-auto text-center bg-logo mx-3 mb-3">
        //             <h1 class="fs-24" id="market_name">${orderData.market_name}</h1>
        //             <p class="fs-10" id="market_address">ต.บางเค็ม อ.เขาย้อย จ.เพชรบุรี 76140</p>
        //         </div>
        //         <p class="text-break mb-0">
        //             Order: <span id="order">${orderData.order_runnumber}</span><br>
        //             ชื่อลูกค้า <span id="name">${orderData.user_name}</span><br>
        //             lineID: <span id="line_id">${input.line_id}</span><br>
        //             วันที่: <span id="date">${moment(order.get('created_at'), "YYYY-MM-DD").locale('th').add(543, 'years').format("dd D MMM YYYY")}</span>
        //         </p>
        //         <table class="table">
        //             <thead>
        //                 <tr>
        //                     <th scope="col">รายการ</th>
        //                     <th scope="col">วันที่จอง</th>
        //                     <th scope="col" class="text-end">ราคา</th>
        //                 </tr>
        //             </thead>
        //             <tbody class="table-group-divider text-break">
        //                 ${htmlElems.product}
        //                 ${input.appliances.length <= 0 && input.service == 0 ?
        //         `<tr>
        //             <td class="fw-bolder">รวม</td>
        //             <td colspan="2" class="text-end">${totolPrice}</td>
        //         </tr>` : ``}
        //             </tbody>
        //         </table>
        //         ${input.appliances.length > 0 || input.service == 1 ? `
        //             <table class="table">
        //                 <thead>
        //                     <tr>
        //                         <th scope="col"></th>
        //                         <th scope="col">รายการ</th>
        //                         <th scope="col"></th>
        //                         <th scope="col">วัน</th>
        //                         <th scope="col" class="text-end">ราคา</th>
        //                     </tr>
        //                 </thead>
        //                 <tbody class="table-group-divider text-break">
        //                     ${htmlElems.other}
        //                     <tr>
        //                         <td scope="col" colspan="2" class="fw-bolder">รวม</td>
        //                         <td scope="col" class="text-end fw-bolder" colspan="3">${totolPrice}</td>
        //                     </tr>
        //                 </tbody>
        //             </table>
        //         `: ``}
        //         <div class="d-flex">
        //             <span class="me-auto">ใบเสร็จรับเงิน/ใบกำกับภาษี </span>
        //             <span>ออกโดย: Q Khajorn</span>
        //         </div>

        //     </div>
        // </body>

        // </html>`;

        const paymentMessage = this.createPaymentMessage(orderData.order_runnumber, dataRecipt.totolPrice);
        // console.log(paymentMessage);
        const data = {
            to: input.line_id,
            messages: [
                {
                    type: "text",
                    text: `การจองของคุณเรียบร้อยแล้วหมายเลขการจอง: ${orderData.order_runnumber}`
                },
                paymentMessage
            ]
        }
        this.sendMessageLine(data);
        const job = scheduleJob(new Date(Date.now() + environment.countdownTime * 60 * 1000), () => {
            this.cancelOrder(orderModelSave.id);
        });
        this.jobs.set(orderModelSave.id, job);
        return {
            "res_code": 200,
            "message": "success",
            "order_id": orderData.order_runnumber
        }
    }
    async cancelOrder(orderId: string) {
        const job = this.jobs.get(orderId);
        if (!job) {
            return;
        }

        if (this.confirmedOrders.has(orderId)) {
            console.log(`Order ${orderId} has been confirmed, cancelling the timer.`);
            job.cancel();
            this.jobs.delete(orderId);
            return;
        }

        console.log(`Cancelling order ${orderId} due to timeout.`);
        this.jobs.delete(orderId);
        const order = await new lab_models.OrderTb().where('id', orderId).fetch();
        if (order) {
            await order.clone().save({
                status_pay: 'fail',
            }, { patch: true, method: 'update' })

            console.log(`Order ${orderId} has been cancelled.`);
        }
    }
    async sendMessageLine(data: Object) {
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment.lineConfig.channelAccessToken}`
            }
        }
        try {
            const res = await (await axios.post(`https://api.line.me/v2/bot/message/push`, data, config)).data
            console.log(res)
            return res;
        } catch (err) {
            console.error(err.response.data)
        }
    }
    createOtherBox() {
        return {
            type: "box",
            layout: "vertical",
            spacing: "none",
            contents: [
                {
                    type: "text",
                    text: "บริการไฟฟ้า (฿100)",
                    contents: []
                },
                {
                    type: "box",
                    layout: "baseline",
                    contents: [
                        {
                            type: "text",
                            text: "100 x 4 วัน",
                            weight: "regular",
                            size: "sm",
                            color: "#AAAAAA",
                            flex: 0,
                            margin: "none",
                            contents: []
                        },
                        {
                            type: "text",
                            text: "฿400.00",
                            size: "sm",
                            color: "#555555FF",
                            align: "end",
                            contents: []
                        }
                    ]
                }
            ]
        }
    }
    createSectionBox(sectionModel, section) {
        return {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
                {
                    type: "text",
                    text: `แผง ${sectionModel.get('name')}`,
                    contents: []
                },
                ...section.days.map(day => {
                    return {
                        type: "box",
                        layout: "baseline",
                        contents: [
                            {
                                type: "text",
                                text: `วันที่จอง ${moment(day, 'YYYY-MM-DD').locale('th').add(543, 'years').format("DD/MM/YY")}`,
                                weight: "regular",
                                size: "sm",
                                color: "#AAAAAA",
                                flex: 0,
                                margin: "sm",
                                contents: []
                            },
                            {
                                type: "text",
                                text: `฿${sectionModel.get('price')}`,
                                size: "sm",
                                color: "#555555FF",
                                align: "end",
                                contents: []
                            }
                        ]
                    }
                })
            ]
        }
    }
    writeFile(filePath: string, content: string) {
        try {
            writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Error writing file: ${error}`);
        }
    }
    wrapMessage(contents) {
        return {
            type: "flex",
            altText: "คุณได้รับ",
            contents: contents
        }
    };
    createPaymentMessage(order_id, price) {
        return this.wrapMessage(
            {
                type: "bubble",
                hero: {
                    type: "image",
                    url: "https://sv1.picz.in.th/images/2023/02/23/LFR3B9.png",
                    size: "full",
                    aspectRatio: "20:13",
                    aspectMode: "cover",
                    action: {
                        type: "uri",
                        label: "Action",
                        uri: "https://linecorp.com/"
                    }
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [
                        {
                            type: "text",
                            text: "โอนเงินผ่านบัญชีธนาคาร",
                            weight: "bold",
                            size: "xl",
                            gravity: "center",
                            wrap: true,
                            contents: []
                        },
                        {
                            type: "text",
                            text: `กรุณาชำระเงินภายใน ${environment.countdownTime} นาที`,
                            color: "#AAAAAA",
                            contents: []
                        },
                        {
                            type: "text",
                            text: "คุณสามารถสแกนคิวอาร์โค้ดด้วยแอปพลิเคชันธนาคารบนมือถือ",
                            color: "#AAAAAA",
                            wrap: true,
                            contents: []
                        },
                        {
                            type: "separator"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "spacer"
                                },
                                {
                                    type: "text",
                                    text: "หมายเลขออเดอร์",
                                    color: "#AAAAAA",
                                    contents: []
                                },
                                {
                                    type: "text",
                                    text: `${order_id}`,
                                    contents: []
                                },
                                {
                                    type: "spacer"
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: `฿${price}`,
                                    weight: "regular",
                                    size: "xxl",
                                    color: "#E07474FF",
                                    contents: []
                                },
                                {
                                    type: "spacer"
                                }
                            ]
                        },
                        {
                            type: "button",
                            action: {
                                type: "uri",
                                label: "แจ้งการชำระเงิน",
                                uri: `${environment.WEB_URL}/profile-market/order/${order_id}`
                            },
                            color: "#E07474FF",
                            style: "primary"
                        }
                    ]
                }
            }
        );
    }
    createRecipt(input) {
        const receipt = {
            type: "bubble",
            header: {
                type: "box",
                layout: "vertical",
                flex: 0,
                contents: [
                    {
                        type: "spacer",
                        size: "xs"
                    }
                ]
            },
            hero: {
                type: "image",
                url: "https://sv1.picz.in.th/images/2023/02/22/Lelbv2.png",
                size: "xl",
                aspectRatio: "20:13",
                aspectMode: "cover",
                action: {
                    type: "uri",
                    label: "Action",
                    uri: "https://linecorp.com"
                }
            },
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                action: {
                    type: "uri",
                    label: "Action",
                    uri: "https://linecorp.com"
                },
                contents: [
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "Order Detail",
                                weight: "bold",
                                color: "#0C0955FF",
                                align: "center",
                                contents: []
                            },
                            {
                                type: "text",
                                text: `${input.name}`,
                                color: "#0C0955FF",
                                align: "center",
                                contents: []
                            },
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "KJ-20230113-41898232",
                                size: "sm",
                                align: "center",
                                contents: []
                            },
                            {
                                type: "text",
                                text: "16 FEB 2023 / 01:05 PM",
                                size: "sm",
                                color: "#807F7FFF",
                                align: "center",
                                contents: []
                            },
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "separator",
                                color: "#8A8888FF"
                            },
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "รายการจองแผง",
                                weight: "bold",
                                align: "center",
                                contents: []
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        contents: [
                            {
                                type: "text",
                                text: "แผง 28",
                                contents: []
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    {
                                        type: "text",
                                        text: "วันที่จอง 20/11/65",
                                        weight: "regular",
                                        size: "sm",
                                        color: "#AAAAAA",
                                        flex: 0,
                                        margin: "sm",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: "฿120.00",
                                        size: "sm",
                                        color: "#555555FF",
                                        align: "end",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "separator",
                                margin: "md",
                                color: "#8A8888FF"
                            },
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "text",
                                text: "รายการอุปกรณ์",
                                weight: "bold",
                                align: "center",
                                contents: []
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "none",
                        contents: [
                            {
                                type: "text",
                                text: "บริการไฟฟ้า (฿100)",
                                contents: []
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    {
                                        type: "text",
                                        text: "100 x 4 วัน",
                                        weight: "regular",
                                        size: "sm",
                                        color: "#AAAAAA",
                                        flex: 0,
                                        margin: "none",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: "฿400.00",
                                        size: "sm",
                                        color: "#555555FF",
                                        align: "end",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "none",
                        contents: [
                            {
                                type: "text",
                                text: "หลอดไฟ (฿60)",
                                contents: []
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    {
                                        type: "text",
                                        text: "60 x 4 วัน",
                                        weight: "regular",
                                        size: "sm",
                                        color: "#AAAAAA",
                                        flex: 0,
                                        margin: "none",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: "฿240.00",
                                        size: "sm",
                                        color: "#555555FF",
                                        align: "end",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "separator",
                                margin: "md",
                                color: "#8A8888FF"
                            },
                            {
                                type: "spacer",
                                size: "md"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "none",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    {
                                        type: "text",
                                        text: "รวม",
                                        weight: "bold",
                                        size: "xl",
                                        color: "#000000FF",
                                        flex: 0,
                                        margin: "none",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: "฿240.00",
                                        weight: "bold",
                                        size: "xl",
                                        color: "#000000FF",
                                        align: "end",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                                type: "separator",
                                margin: "md",
                                color: "#8A8888FF"
                            },
                            {
                                type: "spacer",
                                size: "md"
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "ใบเสร็จรับเงิน/ใบกำกับภาษี",
                        align: "center",
                        contents: []
                    },
                    {
                        type: "text",
                        text: "ออกโดย: Q Khajorn",
                        align: "center",
                        contents: []
                    }
                ]
            }
        };
    }
    async getOrderId(order_runnumber: string) {
        const order = await new lab_models.OrderTb().where('order_runnumber', order_runnumber).fetch({ withRelated: ['orderAccessorys', 'orderSectionZone.orderSectionZoneDays', 'orderSectionZone.sectionZone', 'market.marketDays'] })
        return order;
    }
}