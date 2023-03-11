import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
//import * as moment from "moment";
import { lab_connect } from "../connect";
import { NotificationAttributes, NotificationEntity } from "./entities/NotificationEntity";
import { SectionZoneTb } from "./section_zone_tb";

export class Notification extends lab_connect.Model<Notification> {


    get tableName() { return 'notification'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    toJSON(): NotificationEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as NotificationEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<Notification> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = NotificationAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<Notification> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = NotificationAttributes.filter(column => {
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

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<Notification>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = NotificationAttributes.filter(column => {
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

    sectionZone() {
        return this.belongsTo(SectionZoneTb, "section_zone_id", 'id')
    }

}