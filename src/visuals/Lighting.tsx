import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
export default function Lighting({studio=false,shadows=true}:{studio?:boolean;shadows?:boolean}){
 const {gl,scene}=useThree();
 useEffect(()=>{const pmrem=new PMREMGenerator(gl),room=new RoomEnvironment();const env=pmrem.fromScene(room,.04,.1,100,{size:64});const old=scene.environment;scene.environment=env.texture;scene.environmentIntensity=studio?.5:.13;return()=>{scene.environment=old;env.dispose();room.dispose();pmrem.dispose();};},[gl,scene,studio]);
 return studio?<><ambientLight intensity={.15}/><directionalLight position={[3,4,5]} intensity={3.1} castShadow={shadows} shadow-mapSize={[1024,1024]} shadow-bias={-.0002}/><directionalLight position={[-3,1,-2]} intensity={1.3} color="#92b6e8"/></>:<><ambientLight intensity={.035}/><pointLight position={[0,0,0]} color="#fff2dc" intensity={2.7} decay={0} castShadow={shadows} shadow-mapSize={[1024,1024]} shadow-camera-near={.025} shadow-camera-far={220} shadow-bias={-.0001} shadow-normalBias={.001}/></>;
}
