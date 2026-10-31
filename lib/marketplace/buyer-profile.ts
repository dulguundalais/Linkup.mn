// V52: a buyer never fills in a freelancer-style profile before ordering or chatting.
// The first time a signed-in member needs a profile row (orders, messages and saved
// services reference profiles), a minimal private one is created from their e-mail.
// Freelancer fields (headline, skills, URL, public portfolio) stay empty until the
// person chooses to become a freelancer.

/** A readable display name from an e-mail address: "dulguun.s@gmail.com" -> "Dulguun S". */
export function defaultDisplayName(email:string|null|undefined):string{
 const local=String(email||'').split('@')[0]||'';
 const words=local.replace(/[0-9]+$/,'').split(/[._+\-]+/).map(w=>w.trim()).filter(Boolean);
 const name=words.map(w=>w.charAt(0).toLocaleUpperCase()+w.slice(1)).join(' ').trim().slice(0,80);
 return name.length>=2?name:'Linkup хэрэглэгч';
}

type Db={from:(table:string)=>any};
export type MinimalProfile={id:string;display_name:string;is_seller:boolean};

/** Returns the member's profile, creating a private buyer profile when none exists. */
export async function ensureBuyerProfile(db:Db,user:{id:string;email?:string|null}):Promise<MinimalProfile|null>{
 const found=await db.from('profiles').select('id,display_name,is_seller').eq('id',user.id);
 if(!found.error){
  const row=((found.data||[]) as MinimalProfile[]).find(p=>p.id===user.id);
  if(row)return row;
 }
 const draft={id:user.id,display_name:defaultDisplayName(user.email),is_seller:false,public_profile:false};
 const created=await db.from('profiles').insert(draft).select('id,display_name,is_seller').single();
 if(!created.error&&created.data)return created.data as MinimalProfile;
 // Another tab may have created it at the same moment.
 if((created.error as {code?:string}|null)?.code==='23505')return {id:user.id,display_name:draft.display_name,is_seller:false};
 return null;
}
