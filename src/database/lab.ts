import { lab_connect } from './connect'
import { OwnersTb } from './lab/owners_tb'
import { MarketTb } from './lab/market_tb'
import { ZoneTb } from './lab/zone_tb'
import { MarketDaysTb } from './lab/market_days_tb'
import { SectionZoneTb } from './lab/section_zone_tb'

const lab_models = {
    OwnersTb,
    MarketTb,
    ZoneTb,
    MarketDaysTb,
    SectionZoneTb,
}


export {
    lab_connect,
    lab_models,
}