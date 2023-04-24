import { readFileSync } from "fs";

const serverCa = readFileSync("./DigiCertGlobalRootCA.crt.pem", "utf8");
export const environmentProduction = {
    NODE_ENV: 'production',
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

