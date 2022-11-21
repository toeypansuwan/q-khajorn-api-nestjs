import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
//import * as moment from "moment";
import { lab_connect } from "../connect";
import { AccessoriesTbAttributes, AccessoriesTbEntity } from "./entities/AccessoriesTbEntity";

export class AccessoriesTb extends lab_connect.Model<AccessoriesTb> {


    get tableName() { return 'accessories_tb'; }
    get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    toJSON(): AccessoriesTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as AccessoriesTbEntity

        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<AccessoriesTb> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  AccessoriesTbAttributes.filter(column => {
              return options.excludeColumns.indexOf(column) == -1;
          })
          if(!Array.isArray(options.columns)) {
              options.columns = []
          }
          for(let c of columns) {
              if(options.columns && options.columns.indexOf(c) == -1) {
                  options.columns.push(c)
              }
          }
          for(let i in options.columns) {
              options.columns[i] = `${this.tableName}.${options.columns[i]}`;
          }
      }
      return super.fetch(options);
  }

  fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<AccessoriesTb> & Bookshelf.Pagination> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  AccessoriesTbAttributes.filter(column => {
              return options.excludeColumns.indexOf(column) == -1;
          })
          if(!Array.isArray(options.columns)) {
              options.columns = []
          }
          for(let c of columns) {
              if(options.columns && options.columns.indexOf(c) == -1) {
                  options.columns.push(c)
              }
          }
      }
      if(!options) {
          options = {
              disableCount: true
          }
      }
      options.disableCount = true;
      // console.log('options', options)
      return super.fetchPage(options)
  }

  fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<AccessoriesTb>> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  AccessoriesTbAttributes.filter(column => {
              return options.excludeColumns.indexOf(column) == -1;
          })
          if(!Array.isArray(options.columns)) {
              options.columns = []
          }
          for(let c of columns) {
              if(options.columns && options.columns.indexOf(c) == -1) {
                  options.columns.push(c)
              }
          }
          for(let i in options.columns) {
              options.columns[i] = `${this.tableName}.${options.columns[i]}`;
          }
      }
      return super.fetchAll(options)
  }

}