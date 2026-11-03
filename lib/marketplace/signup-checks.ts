// V85 (owner, 2026-11-03): help people sign up with an address that can actually
// receive the confirmation e-mail, and a password they can see is strong.
// Note: no website can know whether a mailbox exists before mail is sent — we catch
// malformed addresses, common domain typos and domains that cannot receive mail.

const COMMON=['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','live.com','mail.ru','yandex.ru','protonmail.com','me.com','msn.com','aol.com'];
const TLD_FIX:Record<string,string>={con:'com',cmo:'com',cm:'com',om:'com',comm:'com',coom:'com',ocm:'com',vom:'com',xom:'com',nm:'mn',mm:'mn',nn:'mn'};

export function emailFormatProblem(raw:string):string|null{
 const e=raw.trim();
 if(!e)return 'empty';
 if(/\s/.test(e))return 'space';
 const at=e.split('@');
 if(at.length!==2||!at[0]||!at[1])return 'at';
 const [local,domain]=at;
 if(local.length>64||/^\.|\.$|\.\./.test(local))return 'local';
 if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local))return 'local';
 if(!/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i.test(domain))return 'domain';
 return null;
}

function distance(a:string,b:string):number{
 const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
 for(let j=1;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d[a.length][b.length];
}

/** «Did you mean …?» for a likely typo in a well-known domain or the ending. */
export function suggestEmail(raw:string):string|null{
 const e=raw.trim().toLowerCase();
 const i=e.lastIndexOf('@');if(i<1)return null;
 const local=e.slice(0,i),domain=e.slice(i+1);
 if(!domain||COMMON.includes(domain))return null;
 const dot=domain.lastIndexOf('.');
 const tld=dot>0?domain.slice(dot+1):'';
 const fixed=TLD_FIX[tld]?domain.slice(0,dot+1)+TLD_FIX[tld]:domain;
 if(COMMON.includes(fixed)||fixed!==domain&&!COMMON.some(c=>distance(fixed,c)<=1))return fixed!==domain?local+'@'+fixed:null;
 // A near miss of a well-known provider: one slip anywhere, or two in the name part.
 let best:string|null=null,score=3;
 for(const c of COMMON){const s=distance(fixed,c);if(s<score){score=s;best=c}}
 if(best&&(score<=1||score===2&&best.split('.').pop()===fixed.split('.').pop()))return local+'@'+best;
 return fixed!==domain?local+'@'+fixed:null;
}

/** 'ok' · 'missing' (no such domain) · 'no-mail' (exists, takes no mail) · 'unknown' (could not check). */
export type DomainMail='ok'|'missing'|'no-mail'|'unknown';
export async function domainMail(raw:string,fetcher:typeof fetch=fetch):Promise<DomainMail>{
 const domain=raw.trim().toLowerCase().split('@')[1];
 // Reserved test names (RFC 2606) never resolve; they are used by the test suites.
 if(!domain||/\.(test|example|invalid|localhost)$/.test(domain))return 'unknown';
 try{
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),2500);
  const r=await fetcher('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(domain)+'&type=MX',{headers:{accept:'application/dns-json'},signal:ctl.signal});
  clearTimeout(timer);
  if(!r.ok)return 'unknown';
  const j=await r.json() as {Status?:number;Answer?:{type:number}[]};
  if(j.Status===3)return 'missing';
  if(j.Status!==0)return 'unknown';
  return (j.Answer||[]).some(a=>a.type===15)?'ok':'no-mail';
 }catch{return 'unknown'}
}

export type PasswordChecks={length:boolean;upper:boolean;number:boolean;symbol:boolean};
export function passwordChecks(p:string):PasswordChecks{
 return {length:p.length>=8,upper:/[A-ZА-ЯЁӨҮ]/.test(p),number:/\d/.test(p),symbol:/[^A-Za-z0-9А-Яа-яЁёӨөҮү\s]/.test(p)};
}
/** 0 empty · 1 weak · 2 fair · 3 good · 4 strong. Only length ≥ 8 is required. */
export function passwordStrength(p:string):0|1|2|3|4{
 if(!p)return 0;
 const c=passwordChecks(p);
 if(!c.length)return 1;
 const extras=[c.upper,c.number,c.symbol].filter(Boolean).length+(p.length>=12?1:0);
 return extras>=3?4:extras===2?3:extras===1?2:1;
}
/** Gmail and similar have a web inbox we can open directly. */
export function inboxUrl(raw:string):string|null{
 const d=raw.trim().toLowerCase().split('@')[1]||'';
 if(d==='gmail.com'||d==='googlemail.com')return 'https://mail.google.com/mail/u/0/#search/from%3Anoreply%40linkup.mn';
 if(['outlook.com','hotmail.com','live.com','msn.com'].includes(d))return 'https://outlook.live.com/mail/';
 if(d==='yahoo.com')return 'https://mail.yahoo.com/';
 if(d==='mail.ru')return 'https://e.mail.ru/inbox/';
 if(d==='icloud.com'||d==='me.com')return 'https://www.icloud.com/mail';
 return null;
}
