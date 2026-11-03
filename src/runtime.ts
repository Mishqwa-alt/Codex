import snapshot from './data/ephemeris-snapshot.json';
declare global {interface Window {__ORBITA_ASSETS__?:Record<string,string>}}
export const staticMode=import.meta.env.VITE_STATIC==='true'||!!window.__ORBITA_ASSETS__;
export function assetUrl(path:string):string{return window.__ORBITA_ASSETS__?.[path]||`${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;}
export async function ephemerisFetch(path:string,options?:RequestInit):Promise<Response>{
 if(!staticMode)return fetch(path,options);
 if(options?.signal?.aborted)throw new DOMException('Aborted','AbortError');
 const id=path.split('/api/ephemeris/')[1]?.split('?')[0];
 const record=(snapshot.records as Record<string,unknown>)[id];
 return new Response(JSON.stringify(record||{code:'no_ephemeris',error:'В автономной копии нет опорных данных для этого аппарата.'}),{status:record?200:422,headers:{'Content-Type':'application/json'}});
}
export const snapshotDate=snapshot.createdAt;
