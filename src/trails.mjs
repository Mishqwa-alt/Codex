import {positionAt} from './ephemeris.mjs';
import {estimateMission} from './estimates.mjs';
// A single vector is enough for an estimated coast path. forecast=false means
// "no published forecast", never "hide every estimated trajectory".
export function missionTrail(mission,data,date){
 const bound=['earth','mars','jupiter','mercury'].includes(mission.anchor);
 if(bound){return {kind:mission.kind==='rover'?'host-motion':'local-orbit',points:[]};}
 const points=[];
 for(let i=0;i<=64;i++){
 const when=new Date(+date+(i-12)*2.5*86400000);
 const v=positionAt(data,when)||estimateMission(mission,when).position;
 if(v&&v.every(Number.isFinite))points.push(v);
 }
 return {kind:data?'coast':'estimate',points};
}
