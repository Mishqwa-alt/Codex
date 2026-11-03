import {Component,Suspense,useEffect,useMemo,type ReactNode} from 'react';
import {Html,useGLTF} from '@react-three/drei';
import {assetUrl} from '../runtime';
import * as THREE from 'three';
import type {Mission} from '../types';
export const craftAssets:Record<string,string>={
 'voyager-1':'voyager','voyager-2':'voyager',jwst:'jwst',hubble:'hubble',juno:'juno',perseverance:'perseverance',parker:'parker',chandra:'chandra',mro:'mro',lro:'lro','osiris-apex':'osiris',fermi:'fermi',swift:'swift',sdo:'sdo','stereo-a':'stereo',soho:'soho',hinode:'hinode',tess:'tess'
};
export function modelDescription(m:Mission){return craftAssets[m.id]?'3D-модель NASA · ориентация условная':'Упрощённая 3D-реконструкция · не инженерная модель';}
const boundsCache=new WeakMap<THREE.Object3D,{center:THREE.Vector3;extent:number}>();
function OfficialModel({asset,size,onReady}:{asset:string;size:number;onReady?:()=>void}){
 const {scene}=useGLTF(assetUrl(`/models/${asset}.glb`),assetUrl('/draco/'),false);
 const object=useMemo(()=>{
 let bounds=boundsCache.get(scene);if(!bounds){const box=new THREE.Box3().setFromObject(scene);bounds={center:box.getCenter(new THREE.Vector3()),extent:Math.max(...box.getSize(new THREE.Vector3()).toArray())};boundsCache.set(scene,bounds);}
 const clone=scene.clone(true),{center,extent}=bounds;
 clone.position.sub(center);const group=new THREE.Group();group.add(clone);group.scale.setScalar(size/Math.max(extent,.0001));
 group.traverse(node=>{if(node instanceof THREE.Mesh){node.castShadow=true;node.receiveShadow=true;}});
 return group;
 },[scene,size]);
 useEffect(()=>{onReady?.();},[object,onReady]);
 return <primitive object={object} dispose={null}/>;
}
function Panel({x=1,round=false}:{x?:number;round?:boolean}){return <group position={[x,0,0]}><mesh castShadow receiveShadow rotation={round?[Math.PI/2,0,0]:[0,0,0]}>{round?<cylinderGeometry args={[.6,.6,.025,40]}/>:<boxGeometry args={[1.05,.025,.56]}/>}<meshStandardMaterial color="#1f3e75" metalness={.55} roughness={.3}/></mesh>{!round&&Array.from({length:7},(_,i)=><mesh key={i} position={[-.47+i*.155,.015,0]}><boxGeometry args={[.005,.003,.55]}/><meshStandardMaterial color="#8499ae" metalness={.8} roughness={.3}/></mesh>)}<mesh position={[-x*.45,-.035,0]}><boxGeometry args={[Math.abs(x),.02,.02]}/><meshStandardMaterial color="#9a9eaa" metalness={.7} roughness={.4}/></mesh></group>;}
function Dish(){return <group position={[0,.36,0]}><mesh rotation={[Math.PI,0,0]} castShadow><coneGeometry args={[.38,.11,40,1,true]}/><meshStandardMaterial color="#e2dfca" metalness={.45} roughness={.45} side={THREE.DoubleSide}/></mesh><mesh position={[0,.11,0]}><cylinderGeometry args={[.012,.012,.2,8]}/><meshStandardMaterial color="#d3d7d8" metalness={.8} roughness={.4}/></mesh></group>;}
function Simplified({mission,size}:{mission:Mission;size:number}){
 const rover=mission.kind==='rover',telescope=mission.kind==='telescope',lucy=mission.id==='lucy',nh=mission.id==='new-horizons',voyager=mission.id.startsWith('voyager');
 return <group scale={size/3} rotation={[.3,0,.15]}>
 <mesh castShadow receiveShadow>{telescope?<cylinderGeometry args={[.27,.3,1.2,24]}/>:<boxGeometry args={[.6,.4,.65]}/>}<meshStandardMaterial color={telescope?'#d4d6d9':'#c5a45d'} roughness={.4} metalness={.65}/></mesh>
 {telescope&&<mesh position={[0,.61,0]}><circleGeometry args={[.25,32]}/><meshStandardMaterial color="#080a11" metalness={.3} roughness={.2}/></mesh>}
 {!nh&&!rover&&!voyager&&<><Panel x={.92} round={lucy}/><Panel x={-.92} round={lucy}/></>}
 {!telescope&&!rover&&<Dish/>}
 {(nh||voyager)&&<><mesh position={[-.55,.08,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.16,.16,.7,16]}/><meshStandardMaterial color="#484b4e" metalness={.6} roughness={.5}/></mesh><mesh position={[.34,.22,.13]}><boxGeometry args={[.17,.3,.2]}/><meshStandardMaterial color="#13181d" roughness={.5}/></mesh></>}
 {rover&&<>{[-1,1].map(side=><group key={side}>{[-.35,0,.35].map(z=><mesh key={z} position={[side*.4,-.24,z]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.15,.15,.12,24]}/><meshStandardMaterial color="#34373a" roughness={.8} metalness={.4}/></mesh>)}</group>)}<mesh position={[.2,.58,.12]} castShadow><boxGeometry args={[.1,.7,.08]}/><meshStandardMaterial color="#c9c9c3" metalness={.5} roughness={.5}/></mesh><mesh position={[.2,.94,.12]} castShadow><boxGeometry args={[.3,.13,.15]}/><meshStandardMaterial color="#d1c9a7" roughness={.6}/></mesh></>}
 </group>;
}
class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
export default function Craft({mission,size=.16,detail=true,onReady}:{mission:Mission;size?:number;detail?:boolean;onReady?:()=>void}){
 const fallback=<Simplified mission={mission} size={size}/>;
 const asset=craftAssets[mission.id];
 return asset&&detail?<ModelBoundary key={asset} fallback={<>{fallback}<Html position={[0,.2,0]} center><span className="model-loading">Модель недоступна · упрощённый вид</span></Html></>}><Suspense fallback={fallback}><OfficialModel asset={asset} size={size} onReady={onReady}/></Suspense></ModelBoundary>:fallback;
}
