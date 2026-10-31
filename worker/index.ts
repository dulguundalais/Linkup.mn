import {onRequestGet as config} from '../functions/api/config';
import {onRequestGet as image} from '../functions/api/portfolio-image';
import {onRequestGet as profile} from '../functions/p/[slug]';
import type {PublicEnv} from '../lib/marketplace/public-profile';

// Reuse the existing Pages handlers; browser Auth/Storage remains in Supabase.
// Optional public settings are deliberately absent from the hosted preview.
export default {
 async fetch(request:Request,env:Env & PublicEnv):Promise<Response>{
  const path=new URL(request.url).pathname.replace(/\/$/,'');
  const match=/^\/p\/([^/]+)$/.exec(path);
  const dynamic=path.startsWith('/api/')||path.startsWith('/p/');
  if(!dynamic)return env.ASSETS.fetch(request);
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store'}});
  const publicEnv:PublicEnv=env.HUSTLE_STAGING_BACKEND==='enabled'?env:{};
  try{
   let response:Response;
   if(path==='/api/config')response=config({env:publicEnv});
   else if(path==='/api/portfolio-image')response=await image({request,env:publicEnv});
   else if(match){
    let slug:string;
    try{slug=decodeURIComponent(match[1])}catch{return new Response('Not found',{status:404})}
    response=await profile({request,params:{slug},env:publicEnv});
   }else return new Response('Not found',{status:404});
   return request.method==='HEAD'?new Response(null,{status:response.status,headers:response.headers}):response;
  }catch{
   console.error(JSON.stringify({event:'public_route_unavailable'}));
   return new Response('Unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  }
 }
} satisfies ExportedHandler<Env & PublicEnv>;
