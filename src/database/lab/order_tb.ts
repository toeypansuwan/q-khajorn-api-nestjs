import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import * as moment from "moment";
import { lab_connect } from "../connect";
import { OrderTbAttributes, OrderTbEntity } from "./entities/OrderTbEntity";
import { MarketTb } from "./market_tb";
import { OrderAccessoryTb } from './order_accessory_tb'
import { OrderSectionZoneTb } from "./order_section_zone_tb";
import { UserTb } from "./user_tb";

export class OrderTb extends lab_connect.Model<OrderTb> {


    get tableName() { return 'order_tb'; }
    get hasTimestamps() { return true; }
    get requireFetch() { return false; }

    toJSON(): OrderTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as OrderTbEntity
        if (attrs.created_at) {
            attrs.created_at = moment(this.get('created_at')).format('YYYY-MM-DD HH:mm:ss');
            attrs.created_at = (attrs.created_at == "Invalid date") ? null : attrs.created_at;
        }
        if (attrs.updated_at) {
            attrs.updated_at = moment(this.get('updated_at')).format('YYYY-MM-DD HH:mm:ss');
            attrs.updated_at = (attrs.updated_at == "Invalid date") ? null : attrs.updated_at;
        }
        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<OrderTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderTbAttributes.filter(column => {
                return options.excludeColumns.indexOf(column) == -1;
            })
            if (!Array.isArray(options.columns)) {
                options.columns = []
            }
            for (let c of columns) {
                if (options.columns && options.columns.indexOf(c) == -1) {
                    options.columns.push(c)
                }
            }
            for (let i in options.columns) {
                options.columns[i] = `${this.tableName}.${options.columns[i]}`;
            }
        }
        return super.fetch(options);
    }

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<OrderTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderTbAttributes.filter(column => {
                return options.excludeColumns.indexOf(column) == -1;
            })
            if (!Array.isArray(options.columns)) {
                options.columns = []
            }
            for (let c of columns) {
                if (options.columns && options.columns.indexOf(c) == -1) {
                    options.columns.push(c)
                }
            }
        }
        if (!options) {
            options = {
                disableCount: true
            }
        }
        options.disableCount = true;
        return super.fetchPage(options)
    }

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<OrderTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderTbAttributes.filter(column => {
                return options.excludeColumns.indexOf(column) == -1;
            })
            if (!Array.isArray(options.columns)) {
                options.columns = []
            }
            for (let c of columns) {
                if (options.columns && options.columns.indexOf(c) == -1) {
                    options.columns.push(c)
                }
            }
            for (let i in options.columns) {
                options.columns[i] = `${this.tableName}.${options.columns[i]}`;
            }
        }
        return super.fetchAll(options)
    }

    orderAccessorys() {
        return this.hasMany(OrderAccessoryTb, 'order_id', 'id').query(q => {
            q.innerJoin('accessories_tb', 'order_accessory_tb.assessory_id', 'accessories_tb.id')
            q.select('accessories_tb.id', 'order_accessory_tb.order_id', 'accessories_tb.name', 'accessories_tb.price', 'accessories_tb.image', 'order_accessory_tb.quantity')
        });
    }
    orderSectionZone() {
        return this.hasMany(OrderSectionZoneTb, 'order_id', 'id').query(q => {
            q.select('id', 'section_zone_id', 'order_id', 'price')
        });
    }
    market() {
        return this.belongsTo(MarketTb, 'market_id', 'id').query(q => {
            q.select('id', 'name', 'image', 'time_open', 'time_close', 'service_price')
        });
    }
    users() {
        return this.belongsTo(UserTb, 'user_id', 'id').query(q => {
            q.select('id', 'line_id', 'line_username', 'image',)
        });
    }

}