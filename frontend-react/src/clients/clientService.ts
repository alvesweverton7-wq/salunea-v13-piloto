import { supabase } from '../lib/supabase';

export type ClientRow={id:string;full_name:string;phone:string|null;phone_digits:string|null;whatsapp_opt_in:boolean|null;whatsapp_consent_at:string|null;whatsapp_consent_source:string|null;whatsapp_consent_version:string|null;whatsapp_revoked_at:string|null;status:string};

export async function listActiveClients(companyId:string){
 const {data,error}=await supabase.from('clients').select('id,full_name,phone,phone_digits,whatsapp_opt_in,whatsapp_consent_at,whatsapp_consent_source,whatsapp_consent_version,whatsapp_revoked_at,status').eq('company_id',companyId).eq('status','active').order('full_name').limit(100);
 if(error)throw error;
 return (data??[]) as ClientRow[];
}

export function hasActiveWhatsappConsent(client:ClientRow){return Boolean(client.whatsapp_opt_in&&client.whatsapp_consent_at&&client.whatsapp_consent_source&&client.whatsapp_consent_version&&!client.whatsapp_revoked_at&&client.phone_digits);}
