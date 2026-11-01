'use client';
import {useCallback,useEffect,useState} from 'react';

/** V65: one light/dark preference for every page. Pages that used to ignore it
 *  (information pages, service pages, 404) read and write the same
 *  `hustle-theme` key as the homepage, so the theme no longer flips on navigation. */
export function useSiteTheme():[boolean,()=>void]{
 const [dark,setDark]=useState(false);
 useEffect(()=>{try{setDark(localStorage.getItem('hustle-theme')==='dark')}catch{}},[]);
 const toggle=useCallback(()=>setDark(current=>{const next=!current;try{localStorage.setItem('hustle-theme',next?'dark':'light')}catch{}return next}),[]);
 return [dark,toggle];
}
