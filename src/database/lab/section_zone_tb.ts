import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import { lab_connect } from "../connect";
import { SectionZoneTbAttributes, SectionZoneTbEntity } from "./entities/SectionZoneTbEntity";
import { PointTb } from "./point_tb";

export class SectionZoneTb extends lab_connect.Model<SectionZoneTb> {


    get tableName() { return 'section_zone_tb'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    toJSON(): SectionZoneTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as SectionZoneTbEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<SectionZoneTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = SectionZoneTbAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<SectionZoneTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = SectionZoneTbAttributes.filter(column => {
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

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<SectionZoneTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = SectionZoneTbAttributes.filter(column => {
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
    static dependents = ['points'];
}