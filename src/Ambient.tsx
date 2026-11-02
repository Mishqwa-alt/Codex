import {useRef,useState,useEffect} from 'react';
export default function Ambient(){
 const audio=useRef<AudioContext|null>(null),gain=useRef<GainNode|null>(null);const [on,setOn]=useState(false),[volume,setVolume]=useState(.18);
 useEffect(()=>()=>{void audio.current?.close();},[]);
 const toggle=async()=>{if(!audio.current){const a=new AudioContext();audio.current=a;const master=a.createGain();master.gain.value=volume;master.connect(a.destination);gain.current=master;
 [55,82.4069,110,130.8128,164.8138,220].forEach((freq,i)=>{const oscillator=a.createOscillator(),g=a.createGain(),lfo=a.createOscillator(),depth=a.createGain();oscillator.type='sine';oscillator.frequency.value=freq;g.gain.value=.025;oscillator.connect(g).connect(master);lfo.frequency.value=.035+i*.007;depth.gain.value=.012;lfo.connect(depth).connect(g.gain);lfo.start();oscillator.start();});}
 if(on)await audio.current.suspend();else await audio.current.resume();setOn(!on);};
 return <div className="ambient"><button onClick={()=>void toggle()} aria-pressed={on}>{on?'♫ Выключить музыку':'♫ Эмбиент'}</button>{on&&<input aria-label="Громкость музыки" type="range" min="0" max=".5" step=".01" value={volume} onChange={e=>{setVolume(+e.target.value);if(gain.current)gain.current.gain.setTargetAtTime(+e.target.value,audio.current!.currentTime,.2);}}/>}</div>;
}
