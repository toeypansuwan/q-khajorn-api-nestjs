
import { environmentProduction } from './environment.prod';
import { environmentDevelopment } from './environment';
import { config } from 'dotenv';
config();

const env = process.env.NODE_ENV == "production" ? environmentProduction : environmentDevelopment

export const version = '0.0.1';
export const environment = {
    PORT: 80,
    body_size: '5mb',
    gracefulShutdownTime: 120,
    lineConfig: {
        channelAccessToken: process.env.CHANNEl_ACCESS_TOKEN,
        channelSecret: process.env.CHANNEL_SECRET,
        defaultRichMenu: process.env.DEFAULT_RICHMENU,
        loginRichMenu: process.env.LOGIN_RICHMENU
    },
    API_URL: process.env.API_URL,
    countdownTime: 1,
    JWT_SECRET: process.env.JWT_SECRET,
    WEB_URL: process.env.WEB_URL,
    ...env
} 