import {notFound} from 'next/navigation';
import PremiumMarketplace from '../../../components/premium-marketplace';
import {services} from '../../../lib/marketplace/catalog';
export const dynamicParams=false;
export function generateStaticParams(){return services.map(s=>({id:s.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const s=services.find(s=>s.id===id);return {title:s?`${s.seller} — Linkup`:'Linkup',description:s?`${s.en} · Жишиг portfolio`:'',robots:{index:false,follow:false}}}
export default async function Seller({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!services.some(s=>s.id===id))notFound();return <PremiumMarketplace view="seller" id={id}/>}
