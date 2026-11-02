import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import type {OrbitControls as OrbitControlsImpl} from 'three-stdlib';
export interface ViewTarget {id:string;position:number[];radius:number;name:string;up?:number[]}
export default function Navigation({target,reset,onMotion,onBack,onHome}:{onBack:()=>void;onHome:()=>void;target:ViewTarget|null;reset:number;onMotion?:(position:number[],target:number[])=>void}){
 const {camera,gl}=useThree();
 const controls=useRef<OrbitControlsImpl>(null),keys=useRef(new Set<string>()),shift=useRef(false),flying=useRef(false),destination=useRef<{eye:THREE.Vector3;look:THREE.Vector3}|null>(null);
 useEffect(()=>{
 const look=new THREE.Vector3(...(target?.position as [number,number,number]||[0,0,0]));
 const r=target?.radius||4.5;
 destination.current={look,eye:look.clone().add((target?.up?new THREE.Vector3(...target.up as [number,number,number]).multiplyScalar(2).add(new THREE.Vector3(.3,.1,.3)):new THREE.Vector3(.35,.4,1)).normalize().multiplyScalar(target?r*4.5:25))};
 },[target?.id,reset]);
 // Track a focused object's position as time changes, without resetting the orbit.
 const previous=useRef<THREE.Vector3|null>(null);
 useEffect(()=>{previous.current=null;},[target?.id]);
 useEffect(()=>{
 if(!target)return;const next=new THREE.Vector3(...target.position as [number,number,number]);
 if(previous.current&&!flying.current){const delta=next.clone().sub(previous.current);if(destination.current){destination.current.eye.add(delta);destination.current.look.add(delta);}else{camera.position.add(delta);controls.current?.target.add(delta);}}
 previous.current=next;
 },[target?.position,camera]);
 useEffect(()=>{
 const canvas=gl.domElement;
 const ignored=(e:KeyboardEvent)=>{const t=e.target as HTMLElement|null;return t?.isContentEditable||!!t?.closest('input,select,textarea,button,[role="dialog"]');};
 const down=(e:KeyboardEvent)=>{if(ignored(e)||document.querySelector('[role="dialog"]')||!canvas.parentElement?.contains(document.activeElement))return;if(['KeyW','KeyA','KeyS','KeyD','Space','KeyC'].includes(e.code)){keys.current.add(e.code);shift.current=e.shiftKey;destination.current=null;e.preventDefault();}if(e.code.startsWith('Shift'))shift.current=true;};
 const up=(e:KeyboardEvent)=>{keys.current.delete(e.code);shift.current=e.shiftKey;};
 const blur=()=>{keys.current.clear();shift.current=false;};
 const focus=()=>canvas.focus({preventScroll:true});
 const back=(e:MouseEvent)=>{e.preventDefault();e.stopPropagation();};canvas.addEventListener('contextmenu',back);
 const wheel=(e:WheelEvent)=>{e.preventDefault();e.stopImmediatePropagation();destination.current=null;const c=controls.current;if(!c)return;const offset=camera.position.clone().sub(c.target);const length=THREE.MathUtils.clamp(offset.length()*Math.exp(THREE.MathUtils.clamp(e.deltaY,-180,180)*.002),c.minDistance,c.maxDistance);offset.setLength(length);camera.position.copy(c.target).add(offset);c.update();};
 canvas.tabIndex=0;canvas.setAttribute('aria-label','3D-карта: WASD — полёт, Shift — быстрее, пробел/C — высота, колесо — приближение');
 canvas.addEventListener('pointerdown',focus);canvas.addEventListener('wheel',wheel,{passive:false,capture:true});
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);canvas.addEventListener('blur',blur);
 return()=>{canvas.removeEventListener('contextmenu',back);canvas.removeEventListener('pointerdown',focus);canvas.removeEventListener('wheel',wheel,true);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);canvas.removeEventListener('blur',blur);};
 },[camera,gl,onBack,onHome]);
 const elapsed=useRef(0);
 useFrame((_state,dt)=>{
 const c=controls.current;if(!c)return;const delta=Math.min(dt,.05);
 if(destination.current){const d=destination.current;camera.position.lerp(d.eye,1-Math.exp(-delta*7));c.target.lerp(d.look,1-Math.exp(-delta*7));if(camera.position.distanceTo(d.eye)<.0001)destination.current=null;c.update();}
 flying.current=keys.current.size>0;
 if(flying.current){
 const forward=camera.getWorldDirection(new THREE.Vector3());forward.y=0;if(forward.lengthSq()<.001)forward.set(0,0,-1);forward.normalize();
 const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
 const move=new THREE.Vector3();
 if(keys.current.has('KeyW'))move.add(forward);
 if(keys.current.has('KeyS'))move.add(forward.clone().negate());
 if(keys.current.has('Space'))move.y+=1;if(keys.current.has('KeyC'))move.y-=1;
 if(keys.current.has('KeyD'))move.add(right);if(keys.current.has('KeyA'))move.sub(right);
 if(move.lengthSq()){const speed=THREE.MathUtils.clamp(camera.position.distanceTo(c.target)*.7,.02,45);move.normalize().multiplyScalar(speed*delta*(shift.current?4:1));camera.position.add(move);c.target.add(move);c.update();}
 }
 elapsed.current+=dt;if(elapsed.current>.2){elapsed.current=0;onMotion?.(camera.position.toArray(),c.target.toArray());}
 });
 return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.1} minDistance={target?Math.max(.02,target.radius*1.18):.025} maxDistance={300} maxPolarAngle={Math.PI-.01} enableZoom mouseButtons={{LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:undefined as unknown as THREE.MOUSE}} onStart={()=>{destination.current=null;}}/>;
}
