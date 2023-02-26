/*
* This file was generated by a tool.
* Rerun sql-ts to regenerate this file.
*/
export interface OrderTbEntity {
  'created_at'?: string | null;
  'id'?: number;
  'market_id': number;
  'market_name': string;
  'order_runnumber': string;
  'price': number;
  'qr_code'?: string | null;
  'service': number;
  'status_pay': string;
  'updated_at'?: string | null;
  'user_id': number;
  'user_name': string;
  'zone_id': number;
  'zone_name': string;
}


export const OrderTbAttributes = [
    "created_at",
    "id",
    "market_id",
    "market_name",
    "order_runnumber",
    "price",
    "qr_code",
    "service",
    "status_pay",
    "updated_at",
    "user_id",
    "user_name",
    "zone_id",
    "zone_name"
];