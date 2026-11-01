// V35.2 — Never trust a client-provided post-login destination without validating it.
// Only known Hustle local routes are accepted; no cross-origin, protocol-relative or
// authentication/recovery endpoints are eligible for a return redirect.
const safeRoutes=new Set([
 '/','/explore/','/solutions/','/project-requests/','/seller-requests/',
 '/buyer/','/seller-studio/','/listing/','/categories/','/my-profile/',
 '/referrals/'
]);
export function safePostLoginPath(input:string|null|undefined):string|null{
 if(!input||input.length>2000||!input.startsWith('/')||input.startsWith('//')||/[\\\u0000-\u001f\u007f]/.test(input))return null;
 try{
  const url=new URL(input,'https://hustle.invalid');
  const normalized=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
  if(url.origin!=='https://hustle.invalid'||!safeRoutes.has(normalized))return null;
  return normalized+url.search;
 }catch{return null}
}
/** V65: why a guest was sent to sign in, so the sign-in page can say so. */
export type SignInReason='save'|'order'|'message'|'request';
const reasons:SignInReason[]=['save','order','message','request'];
export function signInWithReturn(path:string,mode:'buyer'|'seller'='buyer',why?:SignInReason){
 const url=new URLSearchParams({mode});
 const safe=safePostLoginPath(path);
 if(safe)url.set('next',safe);
 if(why&&reasons.includes(why))url.set('why',why);
 return '/login/?'+url.toString();
}
/** Reads the reason from ?why=, or infers it from where the visitor was going. */
export function signInReason(params:URLSearchParams):SignInReason|null{
 const why=params.get('why');
 if(why&&(reasons as string[]).includes(why))return why as SignInReason;
 if(params.get('seller'))return 'message';
 const next=safePostLoginPath(params.get('next'))||'';
 if(params.get('service')||next.startsWith('/listing/'))return 'order';
 if(next.startsWith('/project-requests/'))return 'request';
 return null;
}
// Client-only, per-identity local draft keys. Keys must not contain e-mail or passwords.
export function projectDraftKey(userId:string){
 return 'hustle:v35.3:project:'+userId;
}
export function proposalDraftKey(userId:string,invitationId:string){
 return 'hustle:v35.3:proposal:'+userId+':'+invitationId;
}

// V52 — keep the visitor's intent across sign-up and e-mail confirmation.
// The confirmation link returns to /login/ without query parameters, so the safe
// destination is also kept in this browser for a limited time. Only paths that pass
// safePostLoginPath are stored or returned.
export const RETURN_INTENT_KEY='hustle-return-intent';
const INTENT_TTL=2*24*60*60*1000;
type Store={getItem:(k:string)=>string|null;setItem:(k:string,v:string)=>void;removeItem:(k:string)=>void};
const store=():Store|null=>{try{return typeof localStorage==='undefined'?null:localStorage}catch{return null}};
/** The destination a /login/ visit should resume, built only from validated parameters. */
export function intentFromLoginParams(params:URLSearchParams):string|null{
 const next=safePostLoginPath(params.get('next'));
 if(next)return next;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const out=new URLSearchParams();
 const service=params.get('service'),tier=params.get('tier'),seller=params.get('seller'),ctx=params.get('ctx');
 if(service&&uuid.test(service)){out.set('service',service);if(tier==='Basic'||tier==='Standard'||tier==='Premium')out.set('tier',tier)}
 else if(seller&&/^[a-z0-9][a-z0-9-]{2,59}$/.test(seller)){out.set('seller',seller);if(ctx&&uuid.test(ctx))out.set('ctx',ctx)}
 else return null;
 return safePostLoginPath('/buyer/?'+out.toString());
}
export function rememberReturnIntent(path:string|null,now=Date.now(),s:Store|null=store()):void{
 const safe=safePostLoginPath(path);
 if(!safe||!s)return;
 try{s.setItem(RETURN_INTENT_KEY,JSON.stringify({path:safe,at:now}))}catch{}
}
/** Returns and forgets the stored destination; expired or unsafe values are discarded. */
export function takeReturnIntent(now=Date.now(),s:Store|null=store()):string|null{
 if(!s)return null;
 let raw:string|null=null;
 try{raw=s.getItem(RETURN_INTENT_KEY);s.removeItem(RETURN_INTENT_KEY)}catch{return null}
 if(!raw)return null;
 try{
  const v=JSON.parse(raw) as {path?:unknown;at?:unknown};
  if(typeof v.path!=='string'||typeof v.at!=='number'||now-v.at>INTENT_TTL||v.at>now+60000)return null;
  return safePostLoginPath(v.path);
 }catch{return null}
}
