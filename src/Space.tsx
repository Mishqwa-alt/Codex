import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { planets, planetPosition, scenePosition } from './orbits.mjs';
import type { Ephemeris, Mission } from './types';
import { estimateMission } from './estimates.mjs';
import rawMissions from './data/missions.json';

function Camera({reset,focus,scale}:{reset:number;focus:number[]|null;scale:string}){
 const {camera}=useThree();
 const controls=useRef<React.ComponentRef<typeof OrbitControls>>(null);
 useEffect(()=>{
 const target=focus?scenePosition(focus,scale):[0,0,0];
 camera.position.set(target[0]+1,target[1]+(focus?5:15),target[2]+(focus?7:20));
 controls.current?.target.set(...target as [number,number,number]);
 controls.current?.update();
 },[reset,focus,camera,scale]);
 return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={1.2} maxDistance={130} maxPolarAngle={Math.PI*.93}/>;
}
function Sun(){return <group><mesh><sphereGeometry args={[.19,32,24]}/><meshBasicMaterial color="#ffe3a1"/></mesh><mesh><sphereGeometry args={[.25,24,16]}/><meshBasicMaterial color="#ffad48" transparent opacity={.16}/></mesh><pointLight color="#ffe0b1" intensity={35} decay={1.1}/><Html position={[0,.4,0]} center className="body-label sun-label">СОЛНЦЕ</Html></group>;}
function Belt({scale}:{scale:string}){
 const positions=useMemo(()=>{
 const a=[];let seed=81;
 const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<2600;i++){const r=2.15+rand()*1.1,angle=rand()*Math.PI*2; a.push(...scenePosition([r*Math.cos(angle),r*Math.sin(angle),(rand()-.5)*.12],scale));}
 return new Float32Array(a);
 },[scale]);
 return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#c9bd9a" size={.012} transparent opacity={.35} sizeAttenuation/></points>;
}
function Estimates({date,scale,labels,trajectories,selected,ephemerides,onSelect}:{date:Date;scale:string;labels:boolean;trajectories:boolean;selected:Mission;ephemerides:Record<string,Ephemeris>;onSelect:(id:string)=>void}){
 const [open,setOpen]=useState<string|null>(null);
 const groups=useMemo(()=>planets.filter(p=>['earth','mars','jupiter'].includes(p.id)).map(p=>({p,missions:rawMissions.filter(m=>m.anchor===p.id&&+date>=+new Date(m.launch))})),[date]);
 const shown=useMemo(()=>rawMissions.filter(m=>['voyager-1','voyager-2','new-horizons'].includes(m.id)||m.id===selected.id).map(m=>({m,estimate:estimateMission(m,date)})),[selected,date]);
 return <>{labels&&groups.map(({p,missions})=><group key={p.id} position={scenePosition(planetPosition(p,date),scale)}><Html position={[.15,-.3,0]} zIndexRange={[9,0]}><div className="cluster"><button className="cluster-trigger" onClick={()=>setOpen(open===p.id?null:p.id)}>≈ {missions.length} миссий · {p.name}</button>{open===p.id&&<div className="cluster-list">{missions.map(m=><button key={m.id} onClick={()=>{onSelect(m.id);setOpen(null);}}>{m.name}</button>)}</div>}</div></Html></group>)}{shown.map(({m,estimate})=>{
 const precise=ephemerides[m.id];if(precise&&Math.abs(+new Date(precise.epoch)-+date)<3700000)return null;
 if(!estimate.position)return m.id===selected.id?<group key={m.id}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[(scale==='linear'?.3*.34:3.15*Math.log1p(.3)),(scale==='linear'?(m.region==='outer'?6:2)*.34:3.15*Math.log1p(m.region==='outer'?6:2)),120]}/><meshBasicMaterial color={m.color} transparent opacity={.04} side={THREE.DoubleSide} depthWrite={false}/></mesh><Html position={[0,.3,-3]} center className="area-label">{estimate.label} · координаты неизвестны</Html></group>:null;
 const position=scenePosition(estimate.position,scale);const future=estimateMission(m,new Date(+date+180*86400000));return <group key={m.id}>
 {trajectories&&m.id===selected.id&&m.anchor==='deep'&&future.position&&<Line points={[position,scenePosition(future.position,scale)]} color="#c3a674" dashed dashSize={.06} gapSize={.06} transparent opacity={.6}/>}
 <group position={position}><mesh onClick={e=>{e.stopPropagation();onSelect(m.id);}}><octahedronGeometry args={[m.id===selected.id?.085:.06]}/><meshBasicMaterial color="#c3a674" transparent opacity={.8} wireframe/></mesh>{labels&&<Html position={[.15,.1,0]} zIndexRange={[8,0]}><button className="estimate-label" onClick={()=>onSelect(m.id)}>≈ {m.name}<small>{estimate.label}</small></button></Html>}</group></group>;})}</>;
}
function System({date,scale,labels,trajectories,ephemerides,selected,onSelect,reset,focus}:{date:Date;scale:string;labels:boolean;trajectories:boolean;ephemerides:Record<string,Ephemeris>;selected:Mission;onSelect:(id:string)=>void;reset:number;focus:number[]|null}){
 const modelDay=date.toISOString().slice(0,10);
 const orbitShapes=useMemo(()=>planets.map(p=>Array.from({length:181},(_,i)=>scenePosition(planetPosition(p,new Date(modelDay),i/180*Math.PI*2),scale))),[modelDay,scale]);
 const geometries=useMemo(()=>planets.map((p,i)=>({p,orbit:orbitShapes[i],position:scenePosition(planetPosition(p,date),scale)})),[date,scale,orbitShapes]);
 return <><ambientLight intensity={1.1}/><Stars radius={100} depth={80} count={2300} factor={2.1} saturation={0} fade speed={0}/><Sun/><Belt scale={scale}/><Estimates date={date} scale={scale} labels={labels} trajectories={trajectories} selected={selected} ephemerides={ephemerides} onSelect={onSelect}/><Camera reset={reset} focus={focus} scale={scale}/>
 {geometries.map(({p,orbit,position})=><group key={p.id}>
 <Line points={orbit} color={p.id==='earth'?'#456c80':'#3b464c'} lineWidth={.6} transparent opacity={p.id==='earth'?.7:.45}/>
 <group position={position}><mesh><sphereGeometry args={[p.size,40,24]}/><meshStandardMaterial color={p.color} roughness={.9}/></mesh>
 {p.id==='saturn'&&<mesh rotation={[-Math.PI/2+.35,0,.2]}><ringGeometry args={[p.size*1.35,p.size*2.1,64]}/><meshStandardMaterial color="#a99b7c" transparent opacity={.65} side={THREE.DoubleSide}/></mesh>}
 {labels&&<Html position={[0,p.size+.2,0]} center zIndexRange={[5,0]} className="body-label"><span>{p.name}</span></Html>}</group></group>)}
 {Object.values(ephemerides).filter(e=>Math.abs(new Date(e.epoch).getTime()-date.getTime())<3700000).map(e=>{
 const point=scenePosition(e.points[0].position,scale);const isSelected=selected.id===e.id;
 return <group key={e.id}>
 {trajectories&&e.forecast&&e.points.length>1&&<Line points={e.points.map(p=>scenePosition(p.position,scale))} color={isSelected?'#f5b780':'#709b9c'} dashed dashSize={.12} gapSize={.08} lineWidth={1} transparent opacity={.7}/>}
 <group position={point}><mesh onClick={ev=>{ev.stopPropagation();onSelect(e.id);}}><octahedronGeometry args={[isSelected?.09:.06]}/><meshBasicMaterial color={isSelected?'#ffbb7e':'#8ac5bd'}/></mesh>
 {labels&&<Html position={[.12,.12,0]} zIndexRange={[8,0]}><button className={`craft-label ${isSelected?'selected':''}`} onClick={()=>onSelect(e.id)}>{e.target.split('(')[0].trim()}</button></Html>}
 </group></group>;
 })}
 </>;
}
class Boundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="canvas-fallback">3D-карта недоступна. Включите WebGL в браузере.<br/>Каталог и данные миссий продолжают работать.</div>:this.props.children;}}
export default function Space(props:Parameters<typeof System>[0]){
 const [supported]=useState(()=>{try{const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch{return false;}});
 return <Boundary>{supported?<Canvas camera={{position:[0,15,20],fov:45,near:.01,far:500}} dpr={[1,1.6]} gl={{antialias:true,alpha:true}}><Suspense fallback={null}><System {...props}/></Suspense></Canvas>:<div className="canvas-fallback">Для 3D-карты нужен WebGL 2.<br/>Каталог и данные миссий доступны ниже.</div>}</Boundary>;
}
