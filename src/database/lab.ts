import { lab_connect } from './connect'
import { OwnersTb } from './lab/owners_tb'
import { MarketTb } from './lab/market_tb'
import { ZoneTb } from './lab/zone_tb'
import { MarketDaysTb } from './lab/market_days_tb'
import { SectionZoneTb } from './lab/section_zone_tb'
import { OrderSectionZoneTb } from './lab/order_section_zone_tb'
import { AccessoriesTb } from './lab/accessories_tb'
import { UserTb } from './lab/user_tb'
import { OrderTb } from './lab/order_tb'
import { OrderAccessoryTb } from './lab/order_accessory_tb'
import { OrderSectionZoneDayTb } from './lab/order_section_zone_day_tb'

const lab_models = {
    OwnersTb,
    MarketTb,
    ZoneTb,
    MarketDaysTb,
    SectionZoneTb,
    OrderSectionZoneTb,
    AccessoriesTb,
    UserTb,
    OrderTb,
    OrderAccessoryTb,
    OrderSectionZoneDayTb,
}


export {
    lab_connect,
    lab_models,
}