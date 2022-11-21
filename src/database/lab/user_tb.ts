import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
import * as moment from "moment";
import { lab_connect } from "../connect";
import { UserTbAttributes, UserTbEntity } from "./entities/UserTbEntity";

export class UserTb extends lab_connect.Model<UserTb> {


    get tableName() { return 'user_tb'; }
    get hasTimestamps() { return true; }
    get requireFetch() { return false; }

    toJSON(): UserTbEntity {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as UserTbEntity
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

    fetch(options?: IBookshelf.FetchOptions): Bluebird<UserTb> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  UserTbAttributes.filter(column => {
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

  fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<UserTb> & Bookshelf.Pagination> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  UserTbAttributes.filter(column => {
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

  fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<UserTb>> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  UserTbAttributes.filter(column => {
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