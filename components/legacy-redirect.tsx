'use client';
import {useEffect,useState} from 'react';

/** V50: retired pages forward to the current route, keeping the query string. */
export default function LegacyRedirect({to}:{to:string}){
 const [en,setEn]=useState(false);
 useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}},[]);
 useEffect(()=>{window.location.replace(to+window.location.search+window.location.hash)},[to]);
 return <main style={{minHeight:'60vh',display:'grid',placeItems:'center',fontFamily:'Manrope,Arial,sans-serif'}}>
  <p>{en?'Redirecting…':'Шилжиж байна…'} <a href={to}>Linkup</a></p>
 </main>;
}
