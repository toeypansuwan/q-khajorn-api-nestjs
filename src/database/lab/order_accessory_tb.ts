import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import { lab_connect } from "../connect";
import { OrderAccessoryTbAttributes, OrderAccessoryTbEntity } from "./entities/OrderAccessoryTbEntity";

export class OrderAccessoryTb extends lab_connect.Model<OrderAccessoryTb> {


    get tableName() { return 'order_accessory_tb'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    toJSON(): OrderAccessoryTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as OrderAccessoryTbEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<OrderAccessoryTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderAccessoryTbAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<OrderAccessoryTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderAccessoryTbAttributes.filter(column => {
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

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<OrderAccessoryTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = OrderAccessoryTbAttributes.filter(column => {
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

}