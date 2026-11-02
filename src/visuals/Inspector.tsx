import {Suspense,useCallback,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls,Html} from '@react-three/drei';
import Craft,{craftAssets,modelDescription} from './Craft';
import Lighting from './Lighting';
import type {Mission} from '../types';
export default function Inspector({mission}:{mission:Mission}){
 const [ready,setReady]=useState(!craftAssets[mission.id]);const loaded=useCallback(()=>setReady(true),[]);
 return <div className="model-inspector" data-model-ready={ready} data-model-source={craftAssets[mission.id]?'NASA':'reconstruction'}><div className="model-inspector-canvas"><Canvas shadows dpr={[1,1.5]} camera={{position:[2,1.3,3.2],fov:40,near:.01,far:50}}><color attach="background" args={['#000000']}/><Lighting studio/><Suspense fallback={<Html center><span className="model-loading">Загрузка 3D-модели NASA…</span></Html>}><Craft mission={mission} size={2.1} onReady={loaded}/></Suspense><OrbitControls makeDefault minDistance={1.3} maxDistance={8} enablePan={false}/></Canvas></div><p>{modelDescription(mission)}. Размеры нормализованы для просмотра. Вращайте мышью; колесо меняет приближение.</p></div>;
}
