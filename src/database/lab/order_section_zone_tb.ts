import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import { lab_connect } from "../connect";
import { OrderSectionZoneTbAttributes, OrderSectionZoneTbEntity } from "./entities/OrderSectionZoneTbEntity";
import { OrderSectionZoneDayTb } from "./order_section_zone_day_tb";
import { PointTb } from "./point_tb";
import { SectionZoneTb } from "./section_zone_tb";

export class OrderSectionZoneTb extends lab_connect.Model<OrderSectionZoneTb> {


    get tableName() { return 'order_section_zone_tb'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    toJSON(): OrderSectionZoneTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as OrderSectionZoneTbEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<OrderSectionZoneTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderSectionZoneTbAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<OrderSectionZoneTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderSectionZoneTbAttributes.filter(column => {
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

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<OrderSectionZoneTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderSectionZoneTbAttributes.filter(column => {
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
    points() {
        return this.hasMany(PointTb, 'area_id', 'id').query(q => {
            q.column('axis_x', 'axis_y', 'area_id')
            q.where('type_area', 'section')
        });
    }
    orderSectionZoneDays() {
        return this.hasMany(OrderSectionZoneDayTb, 'order_section_zone_id', 'id').query(q => {
            q.select('id', 'order_section_zone_id', 'date', 'day as dayname')
        });
    }
    sectionZone() {
        return this.belongsTo(SectionZoneTb, 'section_zone_id', 'id').query(q => {
            q.select('id', 'zone_id', 'name', 'image', 'price')
        });
    }

}