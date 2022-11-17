

import { environment } from './../src/environments';
import sqlts from '@rmp135/sql-ts';
import * as fs from 'fs';

const config = {
  "client":"mysql",
  "connection": {
    "host": environment.databases.lab.host,
    "user": environment.databases.lab.username,
    "password": environment.databases.lab.password,
    "database": environment.databases.lab.dbname,
  },
  "interfaceNameFormat": "${table}Entity",
  "enumNameFormat": "${name}Enum",
  "tableNameCasing": "pascal",
  "typeMap": {
    "string": ["date","time","datetime", "varchar", "char", "text", "mediumtext", "longtext", "tinytext", "mediumblob", "blob", "longblob", "tinyblob"],
  }
}

async function main(){
  // const tsString = await sqlts.toTypeScript(config);
  const toObject = await sqlts.toObject(config);
  // console.log(JSON.stringify(toObject, null, 4));
  for(let table of toObject.tables){
    console.log(table.interfaceName);
    let model = {
      tables: [],
      enums: [],
    }
    let attributes = []
    for(let attribute of table.columns){
      attributes.push(attribute.name);
    }
    model.tables.push(table);
    let tsString = await sqlts.fromObject(model, config);
    let attributesString = `export const ${table.interfaceName.replace('Entity', 'Attributes')} = ${JSON.stringify(attributes, null,4)};`
    tsString+=`\n\n${attributesString}`
    // write to file
    let fileName = `${table.interfaceName}.ts`;
    let filePath = `${__dirname}/../src/database/lab/entities/${fileName}`;
    // check if file exists
    let tableName = table.interfaceName.replace('Entity', '');
    // pascal to snake
    tableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
    // remove _
    tableName = tableName.replace('_', '');
    let model_path = `${__dirname}/../src/database/lab/${tableName}.ts`;
    if(!fs.existsSync(model_path)){
      let created_at = attributes.find(item => item.toLowerCase() === 'created_at');
      let updated_at = attributes.find(item => item.toLowerCase() === 'updated_at');
      let tmp = `import { IBookshelf } from "@app/types/IBookshelf";
import Bluebird from "bluebird";
import Bookshelf from "bookshelf";
${created_at || updated_at?'':'//'}import * as moment from "moment";
import { lab_connect } from "../connect";
import { ${table.interfaceName.replace('Entity', 'Attributes')}, ${table.interfaceName} } from "./entities/${table.interfaceName}";

export class ${table.interfaceName.replace('Entity', '')} extends lab_connect.Model<${table.interfaceName.replace('Entity', '')}> {


    get tableName() { return '${tableName}'; }
    get hasTimestamps() { return ${created_at?'true':'false'}; }
    get requireFetch() { return false; }

    toJSON(): ${table.interfaceName} {
        var attrs = lab_connect.Model.prototype.toJSON.apply(this, arguments) as ${table.interfaceName}
`        
      // find created_at from attributes
      // let created_at = attributes.find(item => item.toLowerCase() === 'created_at');
      if(created_at){
tmp+=`        if (attrs.created_at) {
          attrs.created_at = moment(this.get('created_at')).format('YYYY-MM-DD HH:mm:ss');
          attrs.created_at = (attrs.created_at == "Invalid date") ? null : attrs.created_at;
        }`
      }
      // find updated_at from attributes
      // let updated_at = attributes.find(item => item.toLowerCase() === 'updated_at');
      if(updated_at){
tmp+=`         
        if (attrs.updated_at) {
          attrs.updated_at = moment(this.get('updated_at')).format('YYYY-MM-DD HH:mm:ss');
          attrs.updated_at = (attrs.updated_at == "Invalid date") ? null : attrs.updated_at;
        }`
      }

tmp+=`
        return attrs;
    }

    fetch(options?: IBookshelf.FetchOptions): Bluebird<${table.interfaceName.replace('Entity', '')}> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  ${table.interfaceName.replace('Entity', 'Attributes')}.filter(column => {
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
              options.columns[i] = \`\${this.tableName}.\${options.columns[i]}\`;
          }
      }
      return super.fetch(options);
  }

  fetchPage(options?: IBookshelf.FetchPageOptions): Bluebird<Bookshelf.Collection<${table.interfaceName.replace('Entity', '')}> & Bookshelf.Pagination> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  ${table.interfaceName.replace('Entity', 'Attributes')}.filter(column => {
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

  fetchAll(options?: IBookshelf.FetchAllOptions): Bluebird<Bookshelf.Collection<${table.interfaceName.replace('Entity', '')}>> {
      if(options && options.excludeColumns && Array.isArray(options.excludeColumns)) {
          let columns =  ${table.interfaceName.replace('Entity', 'Attributes')}.filter(column => {
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
              options.columns[i] = \`\${this.tableName}.\${options.columns[i]}\`;
          }
      }
      return super.fetchAll(options)
  }

}`
    fs.writeFileSync(model_path, tmp);
    }
    fs.writeFileSync(filePath, tsString);
  }

}
main()