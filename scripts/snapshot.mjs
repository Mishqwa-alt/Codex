import {writeFile} from 'node:fs/promises';
import missions from '../src/data/missions.json' with {type:'json'};
import {getVectors} from '../server/horizons.mjs';
const bodies=[['mercury','199'],['venus','299'],['earth','399'],['mars','499'],['jupiter','599'],['saturn','699'],['uranus','799'],['neptune','899'],['dest-psyche','16;'],['dest-apophis','99942;'],['dest-didymos','65803;']].map(([id,horizons])=>({id,horizons,body:true}));
const snapshot={createdAt:new Date().toISOString(),records:{},failures:{}};
const date=new Date();date.setUTCMinutes(0,0,0);
for(const m of [...bodies,...missions.filter(m=>m.horizons)]){
 try{let vectors,forecast=!m.body,forecastError=null;
 try{vectors=await getVectors(m.horizons,date,forecast);}catch(e){if(e.connectionFailure||e.httpStatus)throw e;forecast=false;forecastError=e.message;vectors=await getVectors(m.horizons,date,false);}
 snapshot.records[m.id]={...vectors,id:m.id,epoch:date.toISOString(),fetchedAt:Date.now(),frame:'ICRF / Ecliptic J2000',center:'Sun',units:'AU, AU/day',timeScale:'UT',forecast,forecastError,source:'NASA/JPL Horizons',statusVerified:false,snapshot:true};console.log(m.id,'OK');
 }catch(e){snapshot.failures[m.id]=e.message;console.log(m.id,'NO COVERAGE');}
}
if(!snapshot.records['voyager-1']||!snapshot.records.earth)throw new Error('Essential snapshot records unavailable; refusing to replace snapshot.');
await writeFile(new URL('../src/data/ephemeris-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n');
console.log('Snapshot saved:',Object.keys(snapshot.records).length);
