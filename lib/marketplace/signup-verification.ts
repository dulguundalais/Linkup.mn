// Only the pending address is kept in this tab. Passwords and codes stay in memory.
export const SIGNUP_PENDING_KEY='hustle-signup-pending';
const TTL=30*60*1000;
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Pending={email:string;seller:boolean;at:number};
function storage():Store|null{try{return typeof sessionStorage==='undefined'?null:sessionStorage}catch{return null}}
export function normalizeSignupCode(value:string){return value.replace(/[\s-]/g,'')}
export function validSignupCode(value:string){return /^\d{6,10}$/.test(normalizeSignupCode(value))}
export function savePendingSignup(email:string,seller:boolean,now=Date.now(),s:Store|null=storage()){
 try{s?.setItem(SIGNUP_PENDING_KEY,JSON.stringify({email:email.trim().toLowerCase(),seller,at:now}))}catch{}
}
export function clearPendingSignup(s:Store|null=storage()){try{s?.removeItem(SIGNUP_PENDING_KEY)}catch{}}
export function readPendingSignup(now=Date.now(),s:Store|null=storage()):Pending|null{
 try{
  const raw=s?.getItem(SIGNUP_PENDING_KEY);if(!raw)return null;
  const v=JSON.parse(raw);
  if(typeof v.email==='string'&&v.email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)&&typeof v.seller==='boolean'&&typeof v.at==='number'&&v.at<=now&&now-v.at<TTL)return v;
 }catch{}
 clearPendingSignup(s);return null;
}
