// export const environmentDevelopment = {
//   NODE_ENV: 'development',
//   databases: {
//     lab: {
//       host: '192.168.1.6',
//       username: 'dev_q',
//       password: '@Qkhajorn1234',
//       dbname: "q_khajorn_db",
//     }
//   },
// };

import { readFileSync } from "fs";

const serverCa = readFileSync("./DigiCertGlobalRootCA.crt.pem", "utf8");
export const environmentDevelopment = {
  NODE_ENV: 'development',
  databases: {
    lab: {
      host: 'q-khajorn-db.mysql.database.azure.com',
      username: 'dev_q',
      password: '@Qkhajorn1234',
      dbname: "q-khajorn-db",
      ssl: {
        rejectUnauthorized: true,
        ca: serverCa
      }
    }
  }
};
