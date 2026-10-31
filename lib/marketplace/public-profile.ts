import {renderPublicSellerPage,type PublicPortfolioData} from './public-portfolio-render';
export type PublicEnv={NEXT_PUBLIC_SUPABASE_URL?:string;NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?:string};
type PublicSeller=PublicPortfolioData;
export async function publicProfile(request:Request,slug:string,env:PublicEnv){
 const en=new URL(request.url).searchParams.get('lang')==='en';
 if(!/^[a-z0-9][a-z0-9-]{2,59}$/.test(slug))return new Response('Profile not found',{status:404});
 if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return new Response('Profiles are not configured',{status:503});
 const result=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/public_seller',{method:'POST',headers:{apikey:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({profile_slug:slug})});
 if(!result.ok)return new Response('Profile unavailable',{status:503});
 const p=await result.json() as PublicSeller|null;
 if(!p)return new Response('Profile not found or not shared publicly',{status:404,headers:{'Cache-Control':'no-store'}});
 const origin=new URL(request.url).origin,url=origin+'/p/'+encodeURIComponent(p.slug),title=p.display_name+' — Linkup',description=(String(p.bio||'').trim().slice(0,180)||p.headline||(en?'Freelancer on Linkup — view services and work samples.':'Linkup дээрх мэргэжилтэн — үйлчилгээ, бүтээлүүдийг үзэх.'));
 const html=renderPublicSellerPage(p,{en,origin,url,title,description});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}
// The portfolio bucket remains PRIVATE. Anon SELECT is available only for
// objects explicitly attached to opt-in public seller profiles (database RLS).
// Sign each permitted image for 60 seconds; never expose a service-role secret
// or turn the whole bucket public.
export async function portfolioImage(request:Request,env:PublicEnv){
 const path=new URL(request.url).searchParams.get('path')||'';
 const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path))
  return new Response('Not found',{status:404,headers:noStore});
 const url=env.NEXT_PUBLIC_SUPABASE_URL, key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return new Response('Unavailable',{status:503,headers:noStore});
 let origin:URL;
 try{origin=new URL(url)}catch{return new Response('Unavailable',{status:503,headers:noStore})}
 if(origin.protocol!=='https:')return new Response('Unavailable',{status:503,headers:noStore});
 const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
 // Legacy anon keys are JWTs; newer sb_publishable keys are NOT JWTs and
 // must not be placed in the Authorization header.
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 try{
  const signingUrl=origin.origin+'/storage/v1/object/sign/portfolio/'+path;
  const signBody=JSON.stringify({expiresIn:60});
  let signing=await fetch(signingUrl,{method:'POST',headers,body:signBody});
  // SDKs on some gateway generations send the publishable key as both
  // apikey and bearer. Retry only an authorization failure and only with
  // the same low-privilege public key; no service-role escalation.
  if((signing.status===401||signing.status===403)&&key.startsWith('sb_publishable_')){
   signing=await fetch(signingUrl,{method:'POST',headers:{...headers,Authorization:'Bearer '+key},body:signBody});
  }
  if(!signing.ok)return new Response('Image not found',{status:404,headers:{...noStore,'X-Hustle-Storage-Step':'sign','X-Hustle-Storage-Status':String(signing.status)}});
  const signed=await signing.json() as {signedURL?:string;signedUrl?:string};
  const candidate=signed.signedURL||signed.signedUrl||'';
  const signedUrl=new URL(candidate.startsWith('/object/')?'/storage/v1'+candidate:candidate,origin.origin);
  // Never follow user-controlled or compromised upstream cross-origin URLs.
  if(signedUrl.origin!==origin.origin||
     !signedUrl.pathname.startsWith('/storage/v1/object/sign/portfolio/'+path)||
     !signedUrl.searchParams.has('token'))
   return new Response('Image unavailable',{status:502,headers:noStore});
  // A 60-second signed URL is intended for the browser. Redirect directly
  // instead of re-fetching from a Worker (which can fail on Storage CDN
  // redirects). The URL was verified to belong to this Supabase project.
  // Content is still held in a private, RLS-protected Storage bucket.
  return new Response(null,{status:302,headers:{...noStore,Location:signedUrl.toString(),
   'Referrer-Policy':'no-referrer'}});

 }catch{return new Response('Image unavailable',{status:502,headers:noStore})}
}
