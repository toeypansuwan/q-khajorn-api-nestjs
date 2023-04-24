import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import * as moment from "moment";
import { lab_connect } from "../connect";
import { AccessoriesTb } from "./accessories_tb";
import { CategoriesTb } from "./categories_tb";
import { MarketTbAttributes, MarketTbEntity } from "./entities/MarketTbEntity";
import { GalleriesTb } from "./galleries_tb";
import { MarketDaysTb } from "./market_days_tb";
import { UserTb } from "./user_tb";
import { ZoneTb } from "./zone_tb";

export class MarketTb extends lab_connect.Model<MarketTb> {


    get tableName() { return 'market_tb'; }
    get hasTimestamps() { return true; }
    get requireFetch() { return false; }
    get columns() {
        return {
            detail: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
            },
        };
    }

    toJSON(): MarketTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as MarketTbEntity
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

    fetch(options?: IBookshelf.FetchOptions): Bluebird<MarketTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = MarketTbAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<MarketTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = MarketTbAttributes.filter(column => {
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
        // console.log('options', options)
        return super.fetchPage(options)
    }

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<MarketTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = MarketTbAttributes.filter(column => {
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

    galleries() {
        return this.hasMany(GalleriesTb, 'market_id', 'id');
    }
    marketDays() {
        return this.hasMany(MarketDaysTb, 'market_id', 'id');
    }
    categories() {
        return this.hasMany(CategoriesTb, 'market_id', 'id');
    }
    zones() {
        return this.hasMany(ZoneTb, 'market_id', 'id');
    }
    accessories() {
        return this.hasMany(AccessoriesTb, 'market_id', 'id');
    }
    user() {
        return this.belongsTo(UserTb, 'admin_id', 'id').query(q => {
            q.select('id', 'line_id', 'line_username', 'image',)
        });
    }

    static dependents = ['galleries', 'marketDays', 'categories', 'zones', 'accessories'];

}