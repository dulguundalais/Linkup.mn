'use client';
import {useEffect,useState} from 'react';

export default function BetaWelcome({email}:{email:string|undefined}){
 const [en,setEn]=useState(false);
 useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=en?'en':'mn'},[en]);
 const t=(mn:string,english:string)=>en?english:mn;
 return <main style={{maxWidth:800,margin:'6rem auto',padding:24,overflowWrap:'anywhere'}}>
  <h1>{t('Linkup туршилтын хувилбар','Linkup Open Beta')}</h1>
  <p>{t('Тавтай морил','Welcome')}, {email}</p>
  <p>{t('Энэ хэсэгт зөвхөн нэвтрэх эрхтэй хэрэглэгч хандах боломжтой.','This area is available to authorized users only.')}</p>
 </main>;
}
