// JPL approximate positions, 1800–2050. Elements and rates per Julian century.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html — ecliptic J2000, heliocentric AU.
export const planets = [
 {id:'mercury',name:'Меркурий',color:'#b4aaa0',size:0.065,a:.38709927,e:.20563593,i:7.00497902,L:252.25032350,p:77.45779628,n:48.33076593,r:[.00000037,.00001906,-.00594749,149472.67411175,.16047689,-.12534081]},
 {id:'venus',name:'Венера',color:'#e1bd80',size:.095,a:.72333566,e:.00677672,i:3.39467605,L:181.97909950,p:131.60246718,n:76.67984255,r:[.00000390,-.00004107,-.00078890,58517.81538729,.00268329,-.27769418]},
 {id:'earth',name:'Земля',color:'#76b4de',size:.1,a:1.00000261,e:.01671123,i:-.00001531,L:100.46457166,p:102.93768193,n:0,r:[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]},
 {id:'mars',name:'Марс',color:'#d78564',size:.08,a:1.52371034,e:.09339410,i:1.84969142,L:-4.55343205,p:-23.94362959,n:49.55953891,r:[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]},
 {id:'jupiter',name:'Юпитер',color:'#cdb498',size:.23,a:5.20288700,e:.04838624,i:1.30439695,L:34.39644051,p:14.72847983,n:100.47390909,r:[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]},
 {id:'saturn',name:'Сатурн',color:'#e1cd99',size:.19,a:9.53667594,e:.05386179,i:2.48599187,L:49.95424423,p:92.59887831,n:113.66242448,r:[-.00125060,-.00050991,.00193609,1222.49362201,-.41897216,-.28867794]},
 {id:'uranus',name:'Уран',color:'#a6d5d6',size:.14,a:19.18916464,e:.04725744,i:.77263783,L:313.23810451,p:170.95427630,n:74.01692503,r:[-.00196176,-.00004397,-.00242939,428.48202785,.40805281,.04240589]},
 {id:'neptune',name:'Нептун',color:'#688bcc',size:.135,a:30.06992276,e:.00859048,i:1.77004347,L:-55.12002969,p:44.96476227,n:131.78422574,r:[.00026291,.00005105,.00035372,218.45945325,-.32241464,-.00508664]}
];
const rad=Math.PI/180;
export function planetPosition(body,date,anomaly){
 const t=(date.getTime()/86400000+2440587.5-2451545)/36525;
 if(t < -2 || t > .5) throw new RangeError('Модель планет применима только в 1800–2050 гг.');
 const [a,e,i,L,p,n]=['a','e','i','L','p','n'].map((k,j)=>body[k]+body.r[j]*t);
 const M=anomaly ?? (((L-p)%360)*rad); let E=M;
 for(let j=0;j<12;j++) E-=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E),w=(p-n)*rad,N=n*rad,I=i*rad;
 return [(Math.cos(w)*Math.cos(N)-Math.sin(w)*Math.sin(N)*Math.cos(I))*x+(-Math.sin(w)*Math.cos(N)-Math.cos(w)*Math.sin(N)*Math.cos(I))*y,(Math.cos(w)*Math.sin(N)+Math.sin(w)*Math.cos(N)*Math.cos(I))*x+(-Math.sin(w)*Math.sin(N)+Math.cos(w)*Math.cos(N)*Math.cos(I))*y,Math.sin(w)*Math.sin(I)*x+Math.cos(w)*Math.sin(I)*y];
}
export function scenePosition(v,scale='log'){
 const r=Math.hypot(...v); if(!r)return [0,0,0];
 const factor=scale==='linear' ? .34 : 3.15*Math.log1p(r)/r;
 return [v[0]*factor,v[2]*factor,-v[1]*factor];
}
export const auKm=149597870.7;
