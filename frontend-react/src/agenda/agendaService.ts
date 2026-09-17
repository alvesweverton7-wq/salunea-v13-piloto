import { supabase } from '../lib/supabase';

export type AgendaClient={id:string;full_name:string;phone:string|null};
export type AgendaService={id:string;name:string;price:number;duration:number};
export type AgendaProfessional={id:string;name:string};
export type AgendaItem={id:string;client_id:string|null;service_id:string|null;professional_id:string|null;starts_at:string;ends_at:string;status:string;notes:string|null};

export async function listAgendaClients(companyId:string){const {data,error}=await supabase.from('clients').select('id,full_name,phone').eq('company_id',companyId).eq('status','active').is('archived_at',null).order('full_name').limit(200);if(error)throw error;return (data??[]) as AgendaClient[];}

export async function listBookableServices(companyId:string,unitId:string){const {data,error}=await supabase.from('unit_services').select('service_id,current_price,default_duration_minutes,services!inner(id,name,status,archived_at)').eq('company_id',companyId).eq('unit_id',unitId).eq('status','active').eq('booking_enabled',true).is('archived_at',null).eq('services.status','active').is('services.archived_at',null);if(error)throw error;return (data??[]).map((row:any)=>({id:row.service_id,name:row.services.name,price:Number(row.current_price),duration:Number(row.default_duration_minutes)})) as AgendaService[];}

export async function listProfessionalsForService(companyId:string,unitId:string,serviceId:string){const {data,error}=await supabase.from('professional_services').select('professional_id,professionals!inner(id,display_name,full_name,status,archived_at)').eq('company_id',companyId).eq('unit_id',unitId).eq('service_id',serviceId).eq('status','active').eq('can_perform',true).is('archived_at',null).eq('professionals.status','active').is('professionals.archived_at',null);if(error)throw error;return (data??[]).map((row:any)=>({id:row.professional_id,name:row.professionals.display_name||row.professionals.full_name})) as AgendaProfessional[];}

export async function listDayAppointments(companyId:string,unitId:string,startIso:string,endIso:string){const {data,error}=await supabase.from('appointments').select('id,client_id,service_id,professional_id,starts_at,ends_at,status,notes').eq('company_id',companyId).eq('unit_id',unitId).gte('starts_at',startIso).lt('starts_at',endIso).order('starts_at');if(error)throw error;return (data??[]) as AgendaItem[];}

export async function createAppointment(input:{companyId:string;unitId:string;clientId:string;serviceId:string;professionalId:string;startsAt:string;notes?:string}){const {data,error}=await supabase.rpc('create_appointment',{p_company_id:input.companyId,p_unit_id:input.unitId,p_client_id:input.clientId,p_service_id:input.serviceId,p_professional_id:input.professionalId,p_starts_at:input.startsAt,p_notes:input.notes?.trim()||null});if(error)throw error;return data as string;}
