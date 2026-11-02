import {Suspense,useMemo,useState,Component,type ReactNode,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Html,Line,Stars} from '@react-three/drei';
import * as THREE from 'three';
import {planets,planetPosition,scenePosition} from './orbits.mjs';
import {estimateMission} from './estimates.mjs';
import {positionAt,missionPositionAt} from './ephemeris.mjs';
import type {Ephemeris,Mission} from './types';
import {missionTrail} from './trails.mjs';
import {destinations} from './missionExtras';
import rawMissions from './data/missions.json';
import Planet,{SunSurface} from './visuals/Planet';
import Craft from './visuals/Craft';
import Navigation,{type ViewTarget} from './visuals/Navigation';
import Lighting from './visuals/Lighting';
const missions=rawMissions as Mission[];
interface Props {date:Date;scale:string;labels:boolean;trajectories:boolean;ephemerides:Record<string,Ephemeris>;selected:Mission;onSelect:(id:string)=>void;reset:number;focus:number[]|null;focusBody:string|null;onBodyFocus:(id:string|null)=>void;shadows:boolean;missionMode:'off'|'points'|'models';trajectoryScope:'selected'|'all';visibleIds:string[];onBack:()=>void;onHome:()=>void;onMotion?:(eye:number[],look:number[])=>void}
function Belt({scale}:{scale:string}){
 const positions=useMemo(()=>{let seed=81;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};const values=[];for(let i=0;i<1800;i++){const r=2.15+rand()*1.1,a=rand()*Math.PI*2;values.push(...scenePosition([r*Math.cos(a),r*Math.sin(a),(rand()-.5)*.1],scale));}return new Float32Array(values);},[scale]);
 return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#a79472" size={.008} transparent opacity={.4}/></points>;
}
function CraftLOD({mission,selected,size}:{mission:Mission;selected:boolean;size:number}){
 const ref=useRef<THREE.Group>(null);const {camera}=useThree();const [detail,setDetail]=useState(false);
 useFrame(()=>{if(!ref.current)return;const near=camera.position.distanceTo(ref.current.getWorldPosition(new THREE.Vector3()))<2;if(near!==detail)setDetail(near);});
 return <group ref={ref}><Craft mission={mission} size={size} detail={detail}/></group>;
}
function MissionPath({mission,data,date,scale,selected,bodies,point}:{mission:Mission;data:Ephemeris|undefined;date:Date;scale:string;selected:boolean;bodies:{p:typeof planets[number];position:[number,number,number]}[];point:[number,number,number]}){
 const key=Math.floor(+date/60000);
 const trail=useMemo(()=>missionTrail(mission,data,new Date(key*60000)),[mission,data,key]);
 let points:[number,number,number][]=[];
 const host=bodies.find(b=>b.p.id===mission.anchor);
 if(trail.kind==='local-orbit'&&host){
 const center=new THREE.Vector3(...host.position),offset=new THREE.Vector3(...point).sub(center),radius=offset.length();
 const x=offset.normalize(),y=new THREE.Vector3(0,1,0).cross(x).normalize();if(y.lengthSq()<.01)y.set(1,0,0);
 points=Array.from({length:97},(_,i)=>center.clone().addScaledVector(x,Math.cos(i/96*Math.PI*2)*radius).addScaledVector(y,Math.sin(i/96*Math.PI*2)*radius).toArray());
 }else if(trail.kind==='host-motion'){
 const p=planets.find(p=>p.id===mission.anchor);if(p)points=Array.from({length:97},(_,i)=>scenePosition(planetPosition(p,date,i/96*Math.PI*2),scale));
 }else points=trail.points.map(p=>scenePosition(p,scale));
 if(points.length<2)return null;
 return <Line userData={{missionId:mission.id,trajectory:true,kind:trail.kind}} points={points} color={selected?'#c3aa80':'#52616c'} transparent opacity={selected?.48:.12} dashed dashSize={host?.008:.06} gapSize={host?.006:.04} lineWidth={.75}/>;
}
function System(props:Props){
 const {date,scale,labels,trajectories,ephemerides,selected,onSelect,reset,focus,focusBody,onBodyFocus,shadows,missionMode,trajectoryScope,visibleIds,onBack,onHome,onMotion}=props;
 const {gl}=useThree();
 const focusPlanet=(id:string)=>{onBodyFocus(id);gl.domElement.focus({preventScroll:true});};
 const [cluster,setCluster]=useState<string|null>(null),[hovered,setHovered]=useState<string|null>(null);
 const day=date.toISOString().slice(0,10);
 const orbits=useMemo(()=>planets.map(p=>Array.from({length:181},(_,i)=>scenePosition(planetPosition(p,new Date(day),i/180*Math.PI*2),scale))),[day,scale]);
 const bodies=useMemo(()=>planets.map((p,i)=>({p,position:scenePosition(positionAt(ephemerides[p.id],date)||planetPosition(p,date),scale),orbit:orbits[i],precise:!!positionAt(ephemerides[p.id],date)})),[date,scale,orbits,ephemerides]);
 const body=bodies.find(b=>b.p.id===focusBody);
 const separate=(v:number[],id:string)=>{
 const m=missions.find(m=>m.id===id),host=bodies.find(b=>b.p.id===m?.anchor);
 if(m?.kind==='rover'&&host){const lat=(id==='perseverance'?18.4447:-4.5895)*Math.PI/180,lon=(id==='perseverance'?77.4508:137.4417)*Math.PI/180;const normal=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)).applyAxisAngle(new THREE.Vector3(0,1,0),.6).applyAxisAngle(new THREE.Vector3(0,0,1),25.19*Math.PI/180);return {point:new THREE.Vector3(...host.position).addScaledVector(normal,host.p.size*1.025).toArray() as [number,number,number],moved:false,normal:normal.toArray(),size:host.p.size*.055};}

 const point=new THREE.Vector3(...scenePosition(v,scale));let moved=false;
 for(const b of bodies){const origin=new THREE.Vector3(...b.position),d=point.clone().sub(origin);if(d.length()<b.p.size*1.6){if(d.length()<.0001){const angle=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);d.set(Math.cos(angle),.5,Math.sin(angle));}point.copy(origin).add(d.normalize().multiplyScalar(b.p.size*1.22));moved=true;}}
 return {point:point.toArray() as [number,number,number],moved,normal:undefined,size:host?host.p.size*.1:.10};
 };
 const craft=useMemo(()=>missions.map(m=>{
 if(+date<+new Date(m.launch))return null;
 const precise=missionPositionAt(m,ephemerides[m.id],date),estimate=estimateMission(m,date),v=precise||estimate.position;
 if(!v)return null;
 // Individual neighborhood estimates live in clusters; selected one is expanded.
 if(!visibleIds.includes(m.id))return null;
 if(!precise&&m.anchor!=='deep'&&m.id!==selected.id&&m.anchor!==focusBody)return null;
 return {m,v,precise:!!precise,estimate};
 }).filter((m):m is NonNullable<typeof m>=>!!m),[date,ephemerides,selected.id,focusBody,visibleIds]);
 const destination=destinations[selected.id],destinationBody=bodies.find(b=>b.p.id===destination?.body),destinationVector=destination?.body?positionAt(ephemerides[destination.body],date):null;
 const destinationPoint=destinationBody?.position||(destinationVector?scenePosition(destinationVector,scale):null);
 const selectedCraft=craft.find(c=>c.m.id===selected.id);
 const craftTarget=focus&&selectedCraft?separate(selectedCraft.v,selected.id).point:focus?scenePosition(focus,scale):null;
 const target:ViewTarget|null=body?{id:body.p.id,position:body.position,radius:body.p.size*(body.p.id==='saturn'?2.3:1.3),name:body.p.name}:craftTarget?{id:selected.id,position:craftTarget,radius:selected.kind==='rover'?.009:.10,name:selected.name,up:selectedCraft?separate(selectedCraft.v,selected.id).normal:undefined}:null;
 const showGroups=missionMode!=='off'&&labels&&!focusBody&&!focus;
 const showingUnknown=!selectedCraft;
 return <><color attach="background" args={['#000000']}/><Lighting shadows={shadows}/><Stars radius={150} depth={100} count={1800} factor={1.1} saturation={0} fade speed={0}/><SunSurface/><Belt scale={scale}/><Navigation target={target} reset={reset} onMotion={onMotion} onBack={onBack} onHome={onHome}/>
 {missionMode!=='off'&&destinationPoint&&destination&&<group position={destinationPoint}><mesh><sphereGeometry args={[.04,16,12]}/><meshBasicMaterial color="#bca4d4" wireframe/></mesh><Html position={[.08,-.1,0]}><span className="destination-label">Цель: {destination.name}</span></Html></group>}
 {bodies.map(({p,position,orbit,precise})=><group key={p.id}><Line points={orbit} color="#35404b" lineWidth={.55} transparent opacity={focusBody?.15:.5}/><group position={position}>
 <group onClick={e=>{e.stopPropagation();focusPlanet(p.id);}}><Planet id={p.id} radius={p.size}/></group>
 {labels&&<Html position={[0,p.size+.08,0]} center zIndexRange={[5,0]}><button className="planet-label" title="Нажмите, чтобы рассмотреть планету" onClick={()=>focusPlanet(p.id)}>{p.name}</button></Html>}
 {showGroups&&['earth','mars','jupiter'].includes(p.id)&&<Html position={[.15,-p.size-.09,0]} zIndexRange={[9,0]}><div className="cluster"><button className="cluster-trigger" onClick={()=>setCluster(cluster===p.id?null:p.id)}>≈ {missions.filter(m=>m.anchor===p.id).length} миссий · {p.name}</button>{cluster===p.id&&<div className="cluster-list">{missions.filter(m=>m.anchor===p.id).map(m=><button key={m.id} onClick={()=>{onSelect(m.id);setCluster(null);}}>{m.name}</button>)}</div>}</div></Html>}
 </group></group>)}
 {missionMode!=='off'&&craft.map(({m,v,precise,estimate})=>{
 const {point,moved,normal,size}=separate(v,m.id),e=ephemerides[m.id],isSelected=m.id===selected.id;
 return <group key={m.id}>
 {false&&moved&&isSelected&&<Line points={[scenePosition(v,scale),point]} color="#8d815d" dashed dashSize={.01} gapSize={.01} lineWidth={.5}/>}
 {trajectories&&(trajectoryScope==='all'||isSelected)&&<MissionPath mission={m} data={e} date={date} scale={scale} selected={isSelected} bodies={bodies} point={point}/>}
 <group position={point} onPointerOver={e=>{e.stopPropagation();setHovered(m.id);}} onPointerOut={()=>setHovered(null)} onClick={e=>{e.stopPropagation();onSelect(m.id);}}>{missionMode==='points'?<points userData={{missionId:m.id,renderMode:'point'}}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([0,0,0]),3]}/></bufferGeometry><pointsMaterial size={isSelected?4:2.5} sizeAttenuation={false} color={isSelected?'#ffe2a1':'#ffffff'} toneMapped={false}/></points>:<group quaternion={normal?new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...normal as [number,number,number])):undefined}><Suspense fallback={null}><CraftLOD mission={m} selected={isSelected} size={size}/></Suspense></group>}
 {labels&&(isSelected||hovered===m.id)&&<Html position={[.12,.1,0]} zIndexRange={[8,0]}><button className={precise?`craft-label ${isSelected?'selected':''}`:'estimate-label'} onClick={()=>onSelect(m.id)}>{m.name}</button></Html>}
 </group></group>;
 })}
 {false&&showingUnknown&&<group><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[(scale==='linear'?.3*.34:3.15*Math.log1p(.3)),(scale==='linear'?(selected.region==='outer'?6:2)*.34:3.15*Math.log1p(selected.region==='outer'?6:2)),120]}/><meshBasicMaterial color={selected.color} transparent opacity={.03} side={THREE.DoubleSide} depthWrite={false}/></mesh>{labels&&<Html position={[0,.3,-3]} center className="area-label">Область перелёта · координаты неизвестны</Html>}</group>}
 </>;
}
class Boundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="canvas-fallback">3D-карта недоступна. Включите WebGL в браузере.<br/>Каталог и данные миссий продолжают работать.</div>:this.props.children;}}
export default function Space(props:Props){
 const [supported]=useState(()=>{try{return !!document.createElement('canvas').getContext('webgl2');}catch{return false;}});
 return <Boundary>{supported?<Canvas shadows={props.shadows?'soft':false} camera={{position:[0,15,20],fov:45,near:.003,far:600}} dpr={[1,1.6]} gl={{antialias:true,alpha:false}} onCreated={({gl,raycaster})=>{raycaster.params.Points.threshold=.01;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.25;}}><System {...props}/></Canvas>:<div className="canvas-fallback">Для 3D-карты нужен WebGL 2.<br/>Каталог и данные миссий доступны ниже.</div>}</Boundary>;
}
