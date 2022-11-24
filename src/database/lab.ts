import { lab_connect } from './connect'
import { OwnersTb } from './lab/owners_tb'
import { MarketTb } from './lab/market_tb'
import { ZoneTb } from './lab/zone_tb'

const lab_models = {
    OwnersTb,
    MarketTb,
    ZoneTb
}


export {
    lab_connect,
    lab_models,
}