import {Suspense,useMemo,useState,Component,type ReactNode,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Html,Line,Stars} from '@react-three/drei';
import * as THREE from 'three';
import {planets,planetPosition,scenePosition} from './orbits.mjs';
import {estimateMission} from './estimates.mjs';
import {positionAt} from './ephemeris.mjs';
import type {Ephemeris,Mission} from './types';
import rawMissions from './data/missions.json';
import Planet,{SunSurface} from './visuals/Planet';
import Craft from './visuals/Craft';
import Navigation,{type ViewTarget} from './visuals/Navigation';
import Lighting from './visuals/Lighting';
const missions=rawMissions as Mission[];
interface Props {date:Date;scale:string;labels:boolean;trajectories:boolean;ephemerides:Record<string,Ephemeris>;selected:Mission;onSelect:(id:string)=>void;reset:number;focus:number[]|null;focusBody:string|null;onBodyFocus:(id:string|null)=>void;shadows:boolean;onMotion?:(eye:number[],look:number[])=>void}
function Belt({scale}:{scale:string}){
 const positions=useMemo(()=>{let seed=81;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};const values=[];for(let i=0;i<1800;i++){const r=2.15+rand()*1.1,a=rand()*Math.PI*2;values.push(...scenePosition([r*Math.cos(a),r*Math.sin(a),(rand()-.5)*.1],scale));}return new Float32Array(values);},[scale]);
 return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#a79472" size={.008} transparent opacity={.4}/></points>;
}
function CraftLOD({mission,selected}:{mission:Mission;selected:boolean}){
 const ref=useRef<THREE.Group>(null);const {camera}=useThree();const [detail,setDetail]=useState(false);
 useFrame(()=>{if(!ref.current)return;const near=camera.position.distanceTo(ref.current.getWorldPosition(new THREE.Vector3()))<2;if(near!==detail)setDetail(near);});
 return <group ref={ref}><Craft mission={mission} size={selected?.18:.12} detail={detail}/></group>;
}
function System(props:Props){
 const {date,scale,labels,trajectories,ephemerides,selected,onSelect,reset,focus,focusBody,onBodyFocus,shadows,onMotion}=props;
 const {gl}=useThree();
 const focusPlanet=(id:string)=>{onBodyFocus(id);gl.domElement.focus({preventScroll:true});};
 const [cluster,setCluster]=useState<string|null>(null);
 const day=date.toISOString().slice(0,10);
 const orbits=useMemo(()=>planets.map(p=>Array.from({length:181},(_,i)=>scenePosition(planetPosition(p,new Date(day),i/180*Math.PI*2),scale))),[day,scale]);
 const bodies=useMemo(()=>planets.map((p,i)=>({p,position:scenePosition(positionAt(ephemerides[p.id],date)||planetPosition(p,date),scale),orbit:orbits[i],precise:!!positionAt(ephemerides[p.id],date)})),[date,scale,orbits,ephemerides]);
 const body=bodies.find(b=>b.p.id===focusBody);
 const separate=(v:number[],id:string)=>{
 const point=new THREE.Vector3(...scenePosition(v,scale));let moved=false;
 for(const b of bodies){const origin=new THREE.Vector3(...b.position),d=point.clone().sub(origin);if(d.length()<b.p.size*1.6){if(d.length()<.0001){const angle=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);d.set(Math.cos(angle),.5,Math.sin(angle));}point.copy(origin).add(d.normalize().multiplyScalar(b.p.size*1.9));moved=true;}}
 return {point:point.toArray() as [number,number,number],moved};
 };
 const craft=useMemo(()=>missions.map(m=>{
 if(+date<+new Date(m.launch))return null;
 const precise=positionAt(ephemerides[m.id],date),estimate=estimateMission(m,date),v=precise||estimate.position;
 if(!v)return null;
 // Individual neighborhood estimates live in clusters; selected one is expanded.
 if(!precise&&m.anchor!=='deep'&&m.id!==selected.id)return null;
 return {m,v,precise:!!precise,estimate};
 }).filter((m):m is NonNullable<typeof m>=>!!m),[date,ephemerides,selected.id]);
 const selectedCraft=craft.find(c=>c.m.id===selected.id);
 const craftTarget=focus&&selectedCraft?separate(selectedCraft.v,selected.id).point:focus?scenePosition(focus,scale):null;
 const target:ViewTarget|null=body?{id:body.p.id,position:body.position,radius:body.p.size*(body.p.id==='saturn'?2.3:1.3),name:body.p.name}:craftTarget?{id:selected.id,position:craftTarget,radius:.14,name:selected.name}:null;
 const showGroups=labels&&!focusBody&&!focus;
 const showingUnknown=!selectedCraft;
 return <><color attach="background" args={['#000000']}/><Lighting shadows={shadows}/><Stars radius={150} depth={100} count={1800} factor={1.1} saturation={0} fade speed={0}/><SunSurface/><Belt scale={scale}/><Navigation target={target} reset={reset} onMotion={onMotion}/>
 {bodies.map(({p,position,orbit,precise})=><group key={p.id}><Line points={orbit} color="#35404b" lineWidth={.55} transparent opacity={focusBody?.15:.5}/><group position={position}>
 <group onClick={e=>{e.stopPropagation();focusPlanet(p.id);}}><Planet id={p.id} radius={p.size}/></group>
 {labels&&<Html position={[0,p.size+.08,0]} center zIndexRange={[5,0]}><button className="planet-label" title="Нажмите, чтобы рассмотреть планету" onClick={()=>focusPlanet(p.id)}>{p.name}{precise&&<span className="exact-body-dot" title="Положение NASA/JPL"/>}</button></Html>}
 {showGroups&&['earth','mars','jupiter'].includes(p.id)&&<Html position={[.15,-p.size-.09,0]} zIndexRange={[9,0]}><div className="cluster"><button className="cluster-trigger" onClick={()=>setCluster(cluster===p.id?null:p.id)}>≈ {missions.filter(m=>m.anchor===p.id).length} миссий · {p.name}</button>{cluster===p.id&&<div className="cluster-list">{missions.filter(m=>m.anchor===p.id).map(m=><button key={m.id} onClick={()=>{onSelect(m.id);setCluster(null);}}>{m.name}</button>)}</div>}</div></Html>}
 </group></group>)}
 {craft.map(({m,v,precise,estimate})=>{
 const {point,moved}=separate(v,m.id),e=ephemerides[m.id],isSelected=m.id===selected.id;
 return <group key={m.id}>
 {moved&&isSelected&&<Line points={[scenePosition(v,scale),point]} color="#8d815d" dashed dashSize={.01} gapSize={.01} lineWidth={.5}/>}
 {trajectories&&precise&&e.forecast&&e.points.length>1&&<Line points={e.points.map(p=>scenePosition(p.position,scale))} color={isSelected?'#e2bd83':'#4c777e'} dashed dashSize={.08} gapSize={.05} lineWidth={.8}/>}
 {trajectories&&!precise&&isSelected&&m.anchor==='deep'&&<Line points={[point,scenePosition(estimateMission(m,new Date(+date+180*86400000)).position||v,scale)]} color="#9a835a" dashed dashSize={.05} gapSize={.04} lineWidth={.7}/>}
 <group position={point} onClick={e=>{e.stopPropagation();onSelect(m.id);}}><Suspense fallback={null}><CraftLOD mission={m} selected={isSelected}/></Suspense>
 {labels&&(!focusBody||isSelected)&&<Html position={[.12,.1,0]} zIndexRange={[8,0]}><button className={precise?`craft-label ${isSelected?'selected':''}`:'estimate-label'} onClick={()=>onSelect(m.id)}>{precise?'':'≈ '}{m.name}{!precise&&<small>{estimate.label}</small>}{moved&&<small>Разнесено для видимости</small>}</button></Html>}
 </group></group>;
 })}
 {showingUnknown&&<group><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[(scale==='linear'?.3*.34:3.15*Math.log1p(.3)),(scale==='linear'?(selected.region==='outer'?6:2)*.34:3.15*Math.log1p(selected.region==='outer'?6:2)),120]}/><meshBasicMaterial color={selected.color} transparent opacity={.03} side={THREE.DoubleSide} depthWrite={false}/></mesh>{labels&&<Html position={[0,.3,-3]} center className="area-label">Область перелёта · координаты неизвестны</Html>}</group>}
 </>;
}
class Boundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="canvas-fallback">3D-карта недоступна. Включите WebGL в браузере.<br/>Каталог и данные миссий продолжают работать.</div>:this.props.children;}}
export default function Space(props:Props){
 const [supported]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2');}catch{return false;}});
 return <Boundary>{supported?<Canvas shadows={props.shadows?'soft':false} camera={{position:[0,15,20],fov:45,near:.003,far:600}} dpr={[1,1.6]} gl={{antialias:true,alpha:false}} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.25;}}><System {...props}/></Canvas>:<div className="canvas-fallback">Для 3D-карты нужен WebGL 2.<br/>Каталог и данные миссий доступны ниже.</div>}</Boundary>;
}
