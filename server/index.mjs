import express from 'express';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getVectors} from './horizons.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const missions=JSON.parse(await readFile(path.join(root,'src/data/missions.json'),'utf8'));
const app=express(),cache=new Map(),inflight=new Map();
let active=0;
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','strict-origin-when-cross-origin');next();});
app.get('/api/health',(_req,res)=>res.json({ok:true,missions:missions.length,ephemerides:'NASA/JPL Horizons',statusVerification:'not-live'}));
app.get('/api/ephemeris/:id',async(req,res)=>{
 const mission=missions.find(m=>m.id===req.params.id);
 if(!mission)return res.status(404).json({error:'Аппарат не найден'});
 if(!mission.horizons)return res.status(422).json({error:'Для этого аппарата источник точных эфемерид пока не подключён.'});
 const raw=req.query.date;
 if(raw!==undefined && (typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(raw)))return res.status(400).json({error:'Ожидается дата YYYY-MM-DD'});
 const date=raw?new Date(raw+'T00:00:00Z'):new Date();
 if(!Number.isFinite(date.getTime())||date.getUTCFullYear()<1970||date.getUTCFullYear()>2050|| (raw&&date.toISOString().slice(0,10)!==raw))return res.status(400).json({error:'Допустимая дата: 1970–2050'});
 // UTC hour buckets bound both cache size and upstream traffic; epoch is always exposed.
 date.setUTCMinutes(0,0,0);
 const key=mission.id+date.toISOString();
 const hit=cache.get(key);
 if(hit && Date.now()-hit.fetchedAt<3600000)return res.json({...hit,cache:true});
 if(!inflight.has(key)){
 if(active>=3)return res.status(429).json({error:'Очередь эфемерид занята. Повторите запрос через несколько секунд.'});
 active++;
 const task=(async()=>{
 let vectors,forecastError=null;
 try{vectors=await getVectors(mission.horizons,date);}catch(error){
 if(error.httpStatus || error.connectionFailure)throw error;
 forecastError=error.message;
 vectors=await getVectors(mission.horizons,date,false);
 }
 const result={...vectors,id:mission.id,epoch:date.toISOString(),fetchedAt:Date.now(),frame:'ICRF / Ecliptic J2000',center:'Sun',units:'AU, AU/day',timeScale:'UT',forecast:!forecastError,forecastError,source:'NASA/JPL Horizons',statusVerified:false};
 if(cache.size>=200)cache.delete(cache.keys().next().value);
 cache.set(key,result); return result;
 })().finally(()=>{active--;inflight.delete(key);});
 inflight.set(key,task);
 }
 try{res.json({...await inflight.get(key),cache:false});}catch(error){res.status(502).json({error:error.message || 'Ошибка получения эфемерид. Положение не подменяется моделью.'});}
});
app.use('/api',(_req,res)=>res.status(404).json({error:'Unknown API route'}));
if(process.env.NODE_ENV==='production'){
 app.use(express.static(path.join(root,'dist')));
 app.get('/{*path}',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{
 const {createServer}=await import('vite');
 const vite=await createServer({root,server:{middlewareMode:true},appType:'spa'});
 app.use(vite.middlewares);
}
const server=app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('ОРБИТА listening on port '+server.address().port));
