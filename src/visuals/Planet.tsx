import {useMemo,Suspense} from 'react';
import {useTexture} from '@react-three/drei';
import * as THREE from 'three';
const mapped=new Set(['earth','mars','venus','jupiter','saturn','neptune']);
// Artistic microrelief, deliberately not an elevation dataset. Seamless 3D noise.
function makeTexture(id:string,height=false){
 const w=512,h=256,bytes=new Uint8Array(w*h*4);
 let seed=813;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const craters=id==='mercury'?Array.from({length:65},()=>{const lat=(rand()-.5)*Math.PI,lon=rand()*Math.PI*2;return {x:Math.cos(lat)*Math.cos(lon),y:Math.sin(lat),z:Math.cos(lat)*Math.sin(lon),r:.025+rand()*.12};}):[];
 const gas=['uranus','jupiter','saturn','neptune'].includes(id);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const u=x/w*Math.PI*2,v=y/h*Math.PI,px=Math.sin(v)*Math.cos(u),py=Math.cos(v),pz=Math.sin(v)*Math.sin(u);
 const n=(Math.sin(px*41+pz*23)*Math.cos(py*57-pz*13)+Math.sin(px*113+py*73+pz*91)*.3)/1.3;
 let crater=0;
 for(const c of craters){const d=Math.sqrt(Math.max(0,2-2*(px*c.x+py*c.y+pz*c.z)))/c.r;if(d<1.35)crater+=d<.8?-.55*(1-d*d/.64):.48*Math.exp(-(((d-1)*8)**2));}
 const band=Math.sin(py*90+n*.5)*.035;
 const base=id==='uranus'?[128,190,196]:id==='sun'?[255,155,40]:[123,119,112];
 const k=(y*w+x)*4;
 if(height){const value=128+n*25+crater*55;bytes[k]=bytes[k+1]=bytes[k+2]=value;}
 else for(let c=0;c<3;c++)bytes[k+c]=Math.max(0,Math.min(255,base[c]*(1+(gas?band:n*.09+crater*.22))));
 bytes[k+3]=255;
 }
 const texture=new THREE.DataTexture(bytes,w,h);texture.needsUpdate=true;texture.wrapS=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;
 if(!height)texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
}
function Material({id,radius}:{id:string;radius:number}){
 const texture=useTexture(`/textures/${id}.jpg`);
 const color=useMemo(()=>{const t=texture.clone();t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;return t;},[texture]);
 const bump=useMemo(()=>makeTexture(id,true),[id]);
 const rocky=['earth','mars'].includes(id);
 return <meshStandardMaterial map={color} roughness={id==='earth'?.72:.95} metalness={0} bumpMap={rocky?bump:null} bumpScale={rocky?radius*.014:0}/>;
}
function ProceduralMaterial({id,radius}:{id:string;radius:number}){
 const texture=useMemo(()=>makeTexture(id),[id]),bump=useMemo(()=>makeTexture(id,true),[id]);
 return <meshStandardMaterial map={texture} roughness={.93} bumpMap={id==='mercury'?bump:null} bumpScale={radius*.025}/>;
}
function Rings({radius}:{radius:number}){
 const rings=useMemo(()=>Array.from({length:24},(_,i)=>({inner:radius*(1.35+i*.033),outer:radius*(1.375+i*.033),color:i%4===0?'#534b39':i%3===0?'#a59572':'#d6c39b',opacity:i===13?.16:.76})),[radius]);
 return <group rotation={[-Math.PI/2,0,0]}>{rings.map((r,i)=><mesh key={i} receiveShadow castShadow><ringGeometry args={[r.inner,r.outer,160]}/><meshStandardMaterial color={r.color} transparent opacity={r.opacity} roughness={1} side={THREE.DoubleSide}/></mesh>)}</group>;
}
export default function Planet({id,radius}:{id:string;radius:number}){
 const tilt:Record<string,number>={earth:23.44,mars:25.19,jupiter:3.13,saturn:26.73,uranus:97.77,neptune:28.32};
 return <group rotation={[0,0,(tilt[id]||0)*Math.PI/180]}>
 <mesh castShadow receiveShadow rotation={[0,.6,0]}><sphereGeometry args={[radius,96,64]}/><Suspense fallback={<meshStandardMaterial color="#a8a8a3" roughness={1}/>}>
 {mapped.has(id)?<Material id={id} radius={radius}/>:<ProceduralMaterial id={id} radius={radius}/>}</Suspense></mesh>
 {id==='saturn'&&<Rings radius={radius}/>}
 {id==='earth'&&<mesh><sphereGeometry args={[radius*1.018,64,40]}/><meshBasicMaterial color="#609aca" transparent opacity={.065} side={THREE.BackSide} depthWrite={false}/></mesh>}
 </group>;
}
export function SunSurface(){const map=useMemo(()=>makeTexture('sun'),[]);return <mesh><sphereGeometry args={[.2,64,40]}/><meshBasicMaterial map={map} color="#ffde97"/></mesh>;}
