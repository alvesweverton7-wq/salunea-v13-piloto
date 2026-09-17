import { supabase } from '../lib/supabase';

export type ClientRow={id:string;full_name:string;phone:string|null;phone_digits:string|null;whatsapp_phone_digits:string|null;whatsapp_opt_in:boolean|null;whatsapp_consent_at:string|null;whatsapp_consent_source:string|null;whatsapp_consent_version:string|null;whatsapp_revoked_at:string|null;status:string};

const CLIENT_PAGE_SIZE=1000;

export async function listActiveClients(companyId:string){
 const rows:ClientRow[]=[];
 for(let from=0;;from+=CLIENT_PAGE_SIZE){
  const {data,error}=await supabase.from('clients').select('id,full_name,phone,phone_digits,whatsapp_phone_digits,whatsapp_opt_in,whatsapp_consent_at,whatsapp_consent_source,whatsapp_consent_version,whatsapp_revoked_at,status').eq('company_id',companyId).eq('status','active').is('archived_at',null).order('full_name').range(from,from+CLIENT_PAGE_SIZE-1);
  if(error)throw error;
  const page=(data??[]) as ClientRow[];
  rows.push(...page);
  if(page.length<CLIENT_PAGE_SIZE)break;
 }
 return rows;
}

export async function createClient(companyId:string,fullName:string,phone:string){
 const {data,error}=await supabase.rpc('create_client',{p_company_id:companyId,p_full_name:fullName.trim(),p_phone:phone.trim()||null});
 if(error)throw error;
 return data as ClientRow;
}

export function hasActiveWhatsappConsent(client:ClientRow){return Boolean(client.whatsapp_opt_in&&client.whatsapp_consent_at&&client.whatsapp_consent_source&&client.whatsapp_consent_version&&!client.whatsapp_revoked_at&&client.whatsapp_phone_digits);}
