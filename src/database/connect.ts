import { environment } from '@app/env';
import knex from 'knex';
import * as bookshelf from 'bookshelf';

const lab_connect_knex = knex({
  client: 'mysql',
  connection: {
    host     :  environment.databases.lab.host,
    user     :  environment.databases.lab.username,
    password :  environment.databases.lab.password,
    database: environment.databases.lab.dbname,
    charset  : 'utf8'
  },
  pool: {
    propagateCreateError: false,
    max: 20,
    idleTimeoutMillis: 30000
  }
})

const lab_connect = bookshelf(lab_connect_knex as any)

export {
  lab_connect
}