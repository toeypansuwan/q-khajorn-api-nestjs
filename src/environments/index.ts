
import { environmentProduction } from './environment.prod';
import { environmentDevelopment } from './environment';

const env = process.env.NODE_ENV == "production" ? environmentProduction : environmentDevelopment

export const version = '0.0.1';
export const environment = {
    PORT: 3100,
    body_size: '5mb',
    gracefulShutdownTime: 120,
    JWT_SECRET: "q}qtWYFm%_j.32Bv",
    lineConfig: {
        channelAccessToken: "B4g7YFOSSP1aYEag/Q1mW7k9AIg/IsRj2XBJO1fmYJqVbtQRaHrNMfxIMzgrA9zENXjiFK7U6ClgssyYqhKlrSiUNPl+9FEZ9bWhS5yMRF6EDl9/4UUc36eZi8u2SyufR1fn/IVBFXUDjhzfzeTHpwdB04t89/1O/w1cDnyilFU=",
        channelSecret: "04cdaba4859950683ed26be5eaacae58"
    },
    API_URL: "https://6a42-2403-6200-8863-79dd-c555-eb0f-e12c-d733.ap.ngrok.io/api/v1/",
    ...env
} 