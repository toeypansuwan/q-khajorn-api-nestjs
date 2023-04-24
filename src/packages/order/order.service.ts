/*
https://docs.nestjs.com/providers#services
*/
import * as moment from 'moment';
import * as crypto from 'crypto';
import axios from 'axios';
import { lab_models } from '@app/database/lab';
import { HttpException, Injectable } from '@nestjs/common';
import { CreateNotification, InputCreateDto } from './dto/order.dto';
import { environment } from '@app/environments';
import { scheduleJob, Job } from 'node-schedule';
import * as generatePayload from 'promptpay-qr';
import * as qrcode from 'qrcode';
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
    private jobMap = new Map<string, Job>();
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
        const uniqueCode = crypto.randomBytes(6).toString('hex');
        const date = moment(new Date()).format("YYYYMMDD");

        const orderData = {
            market_id: marketModel?.get('id'),
            market_name: marketModel?.get('name'),
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
                appliancePrice += applianceData.price;
                await new lab_models.OrderAccessoryTb().save(applianceData)
            }
        }
        if (input.service == 1) {
            dataRecipt.service_price = marketModel?.get('service_price');
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
                dataRecipt.totolPrice += Number(sectionModel.get('price')) + appliancePrice + dataRecipt.service_price
            }
        }
        const order = await orderModel.where('id', orderModelSave.id).fetch()
        const accountNumber = marketModel.get('mobile_number') || marketModel.get('id_card_number')
        const amount = dataRecipt.totolPrice;
        const payload = generatePayload(accountNumber, { amount })
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

        const paymentMessage = this.createPaymentMessage(orderData.order_runnumber, dataRecipt.totolPrice);
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
        const job: Job = scheduleJob(
            new Date(Date.now() + environment.countdownTime * 60 * 1000),
            () => {
                console.log(`Cancel Order ${orderModelSave.id}`)
                this.cancelOrder(orderModelSave.id);
            },
        );
        this.jobMap.set(orderModelSave.id, job);


        return {
            "res_code": 200,
            "message": "wait",
            "order_id": orderData.order_runnumber
        }
    }
    async cancelOrder(orderId): Promise<{
        res_code: number,
        message: string
    }> {
        const order = await new lab_models.OrderTb().where('id', orderId).fetch();
        if (order.get('status_pay') == 'success') {
            throw new Error('รายการนี้ชำระเงินแล้ว ไม่สามารถยกเลิกรายการได้')
        }

        const response = await this.updateStatusOrder(orderId, 'fail', 'การจองถูกยกเลิก');

        const job = this.jobMap.get(orderId);
        if (job) {
            job.cancel();
            this.jobMap.delete(orderId);
        }
        const notificationModel = await new lab_models.Notification().where('order_id', orderId).where('status', 1).fetchAll({ withRelated: ['sectionZone'] });
        notificationModel.forEach(async (notification) => {
            notification.set('status', 0);
            await notification.save();
            const sectionZone = notification.related('sectionZone')
            const data = {
                to: notification.get('line_id'),
                messages: [
                    {
                        type: "text",
                        text: `ตอนนี้คุณสามารถจองแผงที่ ${sectionZone.get('name')} ในวันที่ ${moment(notification.get('date'), "YYYY-MM-DD").add(543, 'year').format("D MMMM YYYY")}`
                    },
                ]
            }
            this.sendMessageLine(data);
        });
        return response;
    }
    async confirmOrder(orderId): Promise<any> {
        const order = await new lab_models.OrderTb().where('id', orderId).fetch({ withRelated: ['orderAccessorys', 'orderSectionZone.orderSectionZoneDays', 'orderSectionZone.sectionZone', 'market.marketDays', 'users'] });
        if (order.get('status_pay') == 'fail') {
            throw new Error('รายการนี้ถูกยกเลิกไปแล้ว')
        }
        const reciptJson = this.createRecipt(order.toJSON());
        const response = await this.updateStatusOrder(orderId, 'success', 'ชำเงินเสร็จสิ้น');

        const reciptWrap = this.wrapMessage(reciptJson);
        const data = {
            to: order.related('users').get('line_id'),
            messages: [
                {
                    type: "text",
                    text: `ชำระเงินรายการ: ${order.get('order_runnumber')} เสร็จสิ้น`
                },
                reciptWrap
            ]
        }
        await this.sendMessageLine(data);

        console.log(order.get('market_id'));
        const market = await new lab_models.MarketTb().where('id', order.get('market_id')).fetch({ withRelated: ['user'] });
        const dataOwner = {
            to: market.related('user').get('line_id'),
            messages: [
                {
                    type: "text",
                    text: `รายการ: ${order.get('order_runnumber')} ชำระเงินเสร็จสิ้นเสร็จสิ้น`
                },
                this.messageConfirmToOwner(order.get('order_runnumber'))
            ]
        }
        await this.sendMessageLine(dataOwner);

        const job = this.jobMap.get(orderId);
        if (job) {
            job.cancel();
            this.jobMap.delete(orderId);
        }
        return response;
    }

    async updateStatusOrder(id: string, status: string, message: string): Promise<{
        res_code: number,
        message: string
    }> {
        const order = await new lab_models.OrderTb().where('id', id).fetch();
        if (!order) {
            throw new HttpException('ไม่พบรายการสั่งจอง รายการนี้', 404);
        }
        await order.clone().save({
            status_pay: status,
        }, { patch: true, method: 'update' })
        return {
            res_code: 200,
            message,
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
            return res;
        } catch (err) {
            throw new HttpException(err.response.data, 500);
        }
    }
    async checkOrderIsOrder(id: string, lineId: string) {
        const user = await new lab_models.UserTb().where('line_id', lineId).fetch();
        if (!user) {
            throw new Error("ไม่พบข้อมูลลูกค้า");
        }
        const order = await new lab_models.OrderTb().where('id', id).where('user_id', user.get('id')).fetch();
        if (!order) {
            throw new Error("คุณไม่มีสิทธิ ในการยกเลิกรายการนี้");
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
                    aspectMode: "fit",
                    offsetTop: "10px"
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
                                    text: `฿${price.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
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
    createRecipt = (order) => {
        let countDays = 0;
        const data = {
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
            },
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
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
                                text: order.market_name,
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
                                text: order.order_runnumber,
                                size: "sm",
                                align: "center",
                                contents: []
                            },
                            {
                                type: "text",
                                text: moment(order.created_at, 'YYYY-MM-DD HH:mm:ss').add(543, 'year').format('D/MM/YY - HH:mm น.'),
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
                        contents: order.orderSectionZone.flatMap((order_section_zone) => [
                            {
                                type: "text",
                                text: `แผง ${order_section_zone.sectionZone.name}`,
                                contents: []
                            },
                            ...order_section_zone.orderSectionZoneDays.map((order_section_zone_day) => {
                                countDays++;
                                return {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: `วันที่จอง ${moment(order_section_zone_day.date, 'YYYY-MM-DD HH:mm:ss').add(543, 'year').format('D/MM/YY')}`,
                                            weight: "regular",
                                            size: "sm",
                                            color: "#AAAAAA",
                                            flex: 0,
                                            margin: "sm",
                                            contents: []
                                        },
                                        {
                                            type: "text",
                                            text: `฿${order_section_zone.price.toFixed(2)}`,
                                            size: "sm",
                                            color: "#555555FF",
                                            align: "end",
                                            contents: []
                                        }
                                    ]
                                }
                            })

                        ])

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
                    order.service || order.orderAccessorys.length > 0 ? {
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
                    } : {
                        type: "box",
                        layout: "vertical",
                        position: "absolute",
                        contents: [
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    order.service ? {
                        type: "box",
                        layout: "vertical",
                        spacing: "none",
                        contents: [
                            {
                                type: "text",
                                text: `บริการไฟฟ้า (฿${order.market.service_price})`,
                                contents: []
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    {
                                        type: "text",
                                        text: `${order.market.service_price} x ${countDays} วัน`,
                                        weight: "regular",
                                        size: "sm",
                                        color: "#AAAAAA",
                                        flex: 0,
                                        margin: "none",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: `฿${(order.market.service_price * countDays).toFixed(2)}`,
                                        size: "sm",
                                        color: "#555555FF",
                                        align: "end",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    } : {
                        type: "box",
                        layout: "vertical",
                        position: "absolute",
                        contents: [
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    order.orderAccessorys.length > 0 ? {
                        type: "box",
                        layout: "vertical",
                        spacing: "none",
                        contents:
                            order.orderAccessorys.flatMap((order_accessory) => [
                                {
                                    type: "text",
                                    text: `${order_accessory.name} (฿${order_accessory.quantity * order_accessory.price})`,
                                    contents: []
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: `${order_accessory.quantity * order_accessory.price} x ${countDays} วัน`,
                                            weight: "regular",
                                            size: "sm",
                                            color: "#AAAAAA",
                                            flex: 0,
                                            margin: "none",
                                            contents: []
                                        },
                                        {
                                            type: "text",
                                            text: `฿${(order_accessory.quantity * order_accessory.price * countDays).toFixed(2)}`,
                                            size: "sm",
                                            color: "#555555FF",
                                            align: "end",
                                            contents: []
                                        }
                                    ]
                                }
                            ])


                    } : {
                        type: "box",
                        layout: "vertical",
                        position: "absolute",
                        contents: [
                            {
                                type: "spacer"
                            }
                        ]
                    },
                    order.service || order.orderAccessorys.length > 0 ? {
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
                    } : {
                        type: "box",
                        layout: "vertical",
                        position: "absolute",
                        contents: [
                            {
                                type: "spacer"
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
                                        color: "#E07474FF",
                                        flex: 0,
                                        margin: "none",
                                        contents: []
                                    },
                                    {
                                        type: "text",
                                        text: `฿${(order.price).toFixed(2)}`,
                                        weight: "bold",
                                        size: "xl",
                                        color: "#E07474FF",
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
        }
        return data;
    }
    createCancelMessage() {
        const data = {
            type: "bubble",
            hero: {
                type: "image",
                url: "https://sv1.picz.in.th/images/2023/02/22/Lelbv2.png",
                align: "center",
                gravity: "center",
                size: "3xl",
                aspectRatio: "10:9",
                aspectMode: "fit",
            },
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                contents: [
                    {
                        type: "text",
                        text: "ชำระเงินสำเร็จ!",
                        weight: "bold",
                        size: "xl",
                        gravity: "center",
                        wrap: true,
                        contents: []
                    },
                    {
                        type: "text",
                        text: "คุณสามารถดูรายละเอียดการจองได้ โดยกดดูรายละเอียดด่านล่าง",
                        weight: "regular",
                        color: "#AAAAAA",
                        align: "start",
                        gravity: "top",
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
                                type: "text",
                                text: "หมายเลขออเดอร์",
                                color: "#AAAAAA",
                                contents: []
                            },
                            {
                                type: "text",
                                text: "#2023011341898232",
                                weight: "regular",
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
                            label: "ดูรายละเอียด",
                            uri: `${environment.WEB_URL}/profile-market/`
                        }

                    }
                ]
            }
        }
    }
    messageConfirmToOwner(order_runnumber: string) {
        const data = {
            type: "bubble",
            hero: {
                type: "image",
                url: "https://sv1.picz.in.th/images/2023/02/22/Lelbv2.png",
                align: "center",
                gravity: "center",
                size: "3xl",
                aspectRatio: "10:9",
                aspectMode: "fit",
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
                        text: "ชำระเงินสำเร็จ!",
                        weight: "bold",
                        size: "xl",
                        gravity: "center",
                        wrap: true,
                        contents: []
                    },
                    {
                        type: "text",
                        text: "คุณสามารถดูรายละเอียดการจองได้ โดยกดดูรายละเอียดด่านล่าง",
                        weight: "regular",
                        color: "#AAAAAA",
                        align: "start",
                        gravity: "top",
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
                                type: "text",
                                text: "หมายเลขออเดอร์",
                                color: "#AAAAAA",
                                contents: []
                            },
                            {
                                type: "text",
                                text: `${order_runnumber}`,
                                weight: "regular",
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
                            label: "ดูรายละเอียด",
                            uri: `${environment.WEB_URL}/profile-market/order/${order_runnumber}`
                        }
                    }
                ]
            }
        }
        const wrapData = this.wrapMessage(data);
        return wrapData;
    }

    async getOrderId(order_runnumber: string) {
        const order = await new lab_models.OrderTb().where('order_runnumber', order_runnumber).fetch({ withRelated: ['orderAccessorys', 'orderSectionZone.orderSectionZoneDays', 'orderSectionZone.sectionZone', 'market.marketDays'] })
        return order;
    }

    async notificationOrder(order_id: string, input: CreateNotification) {
        const order = await new lab_models.OrderTb().where('id', order_id).fetch()
        if (!order) {
            throw new HttpException('ไม่พบรายการจองนี้', 404);
        }
        const notification = await new lab_models.Notification().where('order_id', order_id).where('line_id', input.lineId).where('status', 1).fetch()
        if (notification) {
            throw new Error('รายการนี้คุณมีการแจ้งเตือนแล้ว')
        }
        const notificationModel = await new lab_models.Notification({
            order_id,
            line_id: input.lineId,
            status: 1,
            section_zone_id: input.id,
            date: input.date
        }).save();
        return {
            res_code: 200,
            message: 'บันทึกการแจ้งเตือนสำเร็จ',
            notification: await new lab_models.Notification().where('id', notificationModel.id).fetch({ columns: ['id', 'order_id', 'section_zone_id', 'date'] })
        }
    }
}