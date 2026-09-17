import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AppUser={id:string;full_name:string|null;email:string|null};
type Company={id:string;trade_name:string|null;legal_name:string|null};
type Unit={id:string;name:string;timezone:string|null};
type State={status:'loading'|'signed_out'|'ready'|'needs_unit'|'error';user:User|null;appUser:AppUser|null;companies:Company[];company:Company|null;units:Unit[];unit:Unit|null;error:string|null};
type ContextValue=State&{signIn:(email:string,password:string)=>Promise<string|null>;signOut:()=>Promise<void>;selectCompany:(id:string)=>Promise<void>;selectUnit:(id:string)=>void;reload:()=>Promise<void>};
const initial:State={status:'loading',user:null,appUser:null,companies:[],company:null,units:[],unit:null,error:null};
const AuthTenantContext=createContext<ContextValue|null>(null);

export function AuthTenantProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(initial);
 async function bootstrap(){
  setState(s=>({...s,status:'loading',error:null}));
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){setState({...initial,status:'signed_out'});return;}
  const {data:appUser,error:profileError}=await supabase.from('users').select('id,full_name,email').eq('auth_user_id',user.id).single();
  if(profileError||!appUser){setState({...initial,status:'error',user,error:'Usuário autenticado, mas sem perfil provisionado no Salúnea.'});return;}
  const {data:members,error:memberError}=await supabase.from('company_users').select('company_id').eq('user_id',appUser.id).eq('status','active');
  if(memberError||!members?.length){setState({...initial,status:'error',user,appUser,error:'Perfil sem empresa ativa vinculada.'});return;}
  const ids=[...new Set(members.map(x=>x.company_id))];
  const {data:companies,error:companyError}=await supabase.from('companies').select('id,trade_name,legal_name').in('id',ids).order('trade_name');
  if(companyError||!companies?.length){setState({...initial,status:'error',user,appUser,error:'Não foi possível carregar suas empresas.'});return;}
  const saved=sessionStorage.getItem('activeCompanyId');
  const company=companies.find(x=>x.id===saved)??companies[0];
  await resolveUnits(user,appUser,companies,company);
 }
 async function resolveUnits(user:User,appUser:AppUser,companies:Company[],company:Company){
  sessionStorage.setItem('activeCompanyId',company.id);
  const {data:units,error}=await supabase.from('units').select('id,name,timezone').eq('company_id',company.id).eq('status','active').order('name');
  if(error||!units?.length){setState({status:'error',user,appUser,companies,company,units:[],unit:null,error:'Empresa sem unidade ativa acessível.'});return;}
  const saved=sessionStorage.getItem(`activeUnitId:${company.id}`);
  const unit=units.find(x=>x.id===saved)??(units.length===1?units[0]:null);
  setState({status:unit?'ready':'needs_unit',user,appUser,companies,company,units,unit,error:null});
 }
 async function signIn(email:string,password:string){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)return 'E-mail ou senha inválidos.';await bootstrap();return null;}
 async function signOut(){await supabase.auth.signOut({scope:'local'});sessionStorage.removeItem('activeCompanyId');setState({...initial,status:'signed_out'});}
 async function selectCompany(id:string){const company=state.companies.find(x=>x.id===id);if(!company||!state.user||!state.appUser)return;await resolveUnits(state.user,state.appUser,state.companies,company);}
 function selectUnit(id:string){const unit=state.units.find(x=>x.id===id);if(!unit||!state.company)return;sessionStorage.setItem(`activeUnitId:${state.company.id}`,unit.id);setState(s=>({...s,unit,status:'ready'}));}
 useEffect(()=>{let active=true;void bootstrap();const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(!active)return;if(!session?.user){setState({...initial,status:'signed_out'});return;}if(event==='SIGNED_IN'||event==='USER_UPDATED')void bootstrap();});return()=>{active=false;subscription.unsubscribe();};},[]);
 const value=useMemo(()=>({...state,signIn,signOut,selectCompany,selectUnit,reload:bootstrap}),[state]);
 return <AuthTenantContext.Provider value={value}>{children}</AuthTenantContext.Provider>;
}
export function useAuthTenant(){const value=useContext(AuthTenantContext);if(!value)throw new Error('useAuthTenant deve estar dentro de AuthTenantProvider');return value;}
