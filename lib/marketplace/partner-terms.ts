import {marketplaceClient} from './client';

/** V67: the partner numbers an admin saves in Business rules. Every page reads them
 *  from here so a change in the admin panel shows up everywhere at once. */
export type PartnerTerms={partner_percent:number;attribution_days:number;reward_months:number};
export const DEFAULT_PARTNER_TERMS:PartnerTerms={partner_percent:1,attribution_days:30,reward_months:12};

export async function loadPartnerTerms():Promise<PartnerTerms|null>{
 try{
  const db=await marketplaceClient();
  const {data,error}=await db.rpc('partner_terms');
  const row=Array.isArray(data)?data[0]:data;
  if(error||!row)return null;
  const n=(v:unknown)=>Number(v);
  const terms={partner_percent:n(row.partner_percent),attribution_days:n(row.attribution_days),reward_months:n(row.reward_months)};
  return Object.values(terms).every(Number.isFinite)?terms:null;
 }catch{return null}
}
