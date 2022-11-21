import { lab_connect } from './connect'
import { OwnersTb } from './lab/owners_tb'
import { MarketTb } from './lab/market_tb'

const lab_models = {
    OwnersTb,
    MarketTb
}


export {
    lab_connect,
    lab_models
}