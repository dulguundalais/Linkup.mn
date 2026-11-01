'use client';
import {useCallback,useLayoutEffect,useState} from 'react';

/** V65: one light/dark preference for every page. Pages that used to ignore it
 *  (information pages, service pages, 404) read and write the same
 *  `hustle-theme` key as the homepage, so the theme no longer flips on navigation. */
/** V68: once the page has its theme, end the first-load guard (the hide-until-dark
 *  rule and the no-transition rule) two frames later, so nothing animates on load. */
export function endThemeLoading(){
 try{const d=document.documentElement;requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.remove('v65-loading')))}catch{}
}

export function useSiteTheme():[boolean,()=>void]{
 const [dark,setDark]=useState(false);
 // V68: read before the browser paints, so a dark page never flashes white on navigation.
 useLayoutEffect(()=>{try{setDark(localStorage.getItem('hustle-theme')==='dark')}catch{};endThemeLoading()},[]);
 const toggle=useCallback(()=>setDark(current=>{const next=!current;try{localStorage.setItem('hustle-theme',next?'dark':'light')}catch{}return next}),[]);
 return [dark,toggle];
}
