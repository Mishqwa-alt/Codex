const MU=.0002959122082855911;
export function propagate(position,velocity,days){
 let y=[...position,...velocity],t=0,steps=0;
 const f=s=>{const r=Math.hypot(...s.slice(0,3)),k=-MU/Math.max(r*r*r,1e-12);return [...s.slice(3),...s.slice(0,3).map(v=>v*k)];};
 while(Math.abs(days-t)>1e-8&&steps++<12000){const r=Math.hypot(...y.slice(0,3));const h=Math.sign(days)*Math.min(Math.abs(days-t),2,Math.max(.005,.025*Math.sqrt(r*r*r/MU)));const a=f(y),b=f(y.map((v,i)=>v+h*a[i]/2)),c=f(y.map((v,i)=>v+h*b[i]/2)),d=f(y.map((v,i)=>v+h*c[i]));y=y.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);t+=h;}
 return steps>=12000?null:y.slice(0,3);
}
export function positionAt(data,date){
 if(!data?.points?.length)return null;
 const days=(+date-Date.parse(data.epoch))/86400000;if(!Number.isFinite(days))return null;
 const points=data.points,base=points[0].jd??0;
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],start=a.jd-base,end=b.jd-base;if(days>=start&&days<=end){const h=end-start,u=(days-start)/h;return a.position.map((v,j)=>(2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*h*a.velocity[j]+(-2*u**3+3*u*u)*b.position[j]+(u**3-u*u)*h*b.velocity[j]);}}
 const p=days<0?points[0]:points[points.length-1],dt=days-((p.jd??base)-base);
 if(Math.abs(dt)<=1/24+1e-9)return p.position.map((v,i)=>v+(p.velocity?.[i]||0)*dt);
 if(Math.abs(dt)>365.25*5||!p.velocity)return null;
 return propagate(p.position,p.velocity,dt);
}
export function fiveMinuteBucket(date){const d=new Date(date);d.setUTCSeconds(0,0);d.setUTCMinutes(Math.floor(d.getUTCMinutes()/5)*5);return d;}
export function missionPositionAt(mission,data,date){
 if(data&&['earth','mars','jupiter','mercury'].includes(mission.anchor)){
 const points=data.points,last=points?.[points.length-1];
 const end=last&&points[0].jd!=null?(last.jd-points[0].jd)*86400000:0;
 if(+date-Date.parse(data.epoch)>end+3600000||+date<Date.parse(data.epoch)-3600000)return null;
 }
 return positionAt(data,date);
}
