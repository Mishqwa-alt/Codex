// Position propagation is intentionally limited to one hour around the published
// epoch; never silently reuse a cached position for a different simulation date.
export function positionAt(data,date){
 if(!data?.points?.length)return null;
 const delta=(+date-Date.parse(data.epoch))/86400000;
 if(!Number.isFinite(delta)||Math.abs(delta)>1/24+1e-9)return null;
 const p=data.points[0];
 return p.position.map((v,i)=>v+(p.velocity?.[i]||0)*delta);
}
export function fiveMinuteBucket(date){const d=new Date(date);d.setUTCSeconds(0,0);d.setUTCMinutes(Math.floor(d.getUTCMinutes()/5)*5);return d;}
