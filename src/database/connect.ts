import { environment } from '@app/env';
import knex from 'knex';
import * as bookshelf from 'bookshelf';
import * as cascadeDelete from 'bookshelf-cascade-delete';

const lab_connect_knex = knex({
  client: 'mysql',
  connection: {
    host: environment.databases.lab.host,
    user: environment.databases.lab.username,
    password: environment.databases.lab.password,
    database: environment.databases.lab.dbname,
    charset: 'utf8mb4',
    ssl: environment.databases.lab.ssl,
  },
  pool: {
    propagateCreateError: false,
    max: 20,
    idleTimeoutMillis: 30000
  }
})

const lab_connect = bookshelf(lab_connect_knex as any).plugin(cascadeDelete)

export {
  lab_connect
}