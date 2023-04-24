import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import { lab_connect } from "../connect";
import { CategoriesTb } from "./categories_tb";
import { ZoneTbAttributes, ZoneTbEntity } from "./entities/ZoneTbEntity";
import { PointTb } from "./point_tb";
import { SectionZoneTb } from "./section_zone_tb";

export class ZoneTb extends lab_connect.Model<ZoneTb> {


    get tableName() { return 'zone_tb'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }


    toJSON(): ZoneTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as ZoneTbEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<ZoneTb> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = ZoneTbAttributes.filter(column => {
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

    fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<ZoneTb> & Bookshelf.Pagination> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = ZoneTbAttributes.filter(column => {
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

    fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<ZoneTb>> {
        if (options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
            let columns = ZoneTbAttributes.filter(column => {
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
            q.where('type_area', 'zone')
        });
    }
    categories() {
        return this.belongsToMany(CategoriesTb, 'zone_categories_tb', 'category_id', 'zone_id')
    }
    sections_zone() {
        return this.hasMany(SectionZoneTb, 'zone_id', 'id')
    }
    static dependents = ['points', 'categories', 'sections_zone'];

}