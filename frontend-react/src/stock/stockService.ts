import { supabase } from '../lib/supabase';

export type StockRow={unit_product_id:string;company_id:string;unit_id:string;on_hand:number;reliable_expected_inbound:number;future_committed:number;projected_quantity:number;minimum_stock:number;product_id:string;product_name:string;unit_of_measure:string|null};
export type StockMovementType='purchase'|'adjustment_in'|'sale'|'loss'|'service_consumption';

type Projected={unit_product_id:string;company_id:string;unit_id:string;on_hand:number|string|null;reliable_expected_inbound:number|string|null;future_committed:number|string|null;projected_quantity:number|string|null};
type UnitProduct={id:string;product_id:string;minimum_stock:number|string|null};
type Product={id:string;name:string;unit_of_measure:string|null};

export async function listProjectedStock(companyId:string,unitId:string):Promise<StockRow[]>{
 const [stockRes,unitsRes]=await Promise.all([
  supabase.from('v_projected_stock').select('unit_product_id,company_id,unit_id,on_hand,reliable_expected_inbound,future_committed,projected_quantity').eq('company_id',companyId).eq('unit_id',unitId),
  supabase.from('unit_products').select('id,product_id,minimum_stock').eq('company_id',companyId).eq('unit_id',unitId).eq('status','active')
 ]);
 if(stockRes.error)throw stockRes.error;if(unitsRes.error)throw unitsRes.error;
 const projected=(stockRes.data??[]) as Projected[],units=(unitsRes.data??[]) as UnitProduct[];
 const productIds=[...new Set(units.map(x=>x.product_id).filter(Boolean))];
 let products:Product[]=[];
 if(productIds.length){const res=await supabase.from('products').select('id,name,unit_of_measure').eq('company_id',companyId).in('id',productIds);if(res.error)throw res.error;products=(res.data??[]) as Product[];}
 const byUnit=new Map(units.map(x=>[x.id,x])),byProduct=new Map(products.map(x=>[x.id,x]));
 return projected.flatMap(x=>{const up=byUnit.get(x.unit_product_id);if(!up)return[];const p=byProduct.get(up.product_id);return[{unit_product_id:x.unit_product_id,company_id:x.company_id,unit_id:x.unit_id,on_hand:Number(x.on_hand||0),reliable_expected_inbound:Number(x.reliable_expected_inbound||0),future_committed:Number(x.future_committed||0),projected_quantity:Number(x.projected_quantity||0),minimum_stock:Number(up.minimum_stock||0),product_id:up.product_id,product_name:p?.name||'Produto',unit_of_measure:p?.unit_of_measure||null}];});
}

export async function recordStockMovement(args:{companyId:string;unitId:string;unitProductId:string;movementType:StockMovementType;quantity:number;unitCost:number|null;reason:string|null}){
 const incoming=['purchase','adjustment_in'].includes(args.movementType);const delta=incoming?args.quantity:-args.quantity;
 const {error}=await supabase.rpc('record_stock_movement',{p_company_id:args.companyId,p_unit_id:args.unitId,p_unit_product_id:args.unitProductId,p_movement_type:args.movementType,p_quantity_delta:delta,p_unit_cost_snapshot:args.unitCost,p_reason:args.reason,p_reference_type:null,p_reference_id:null,p_idempotency_key:crypto.randomUUID()});
 if(error)throw error;
}
