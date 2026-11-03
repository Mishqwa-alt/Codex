import {storage} from './storage';
import {useEffect,useRef,useState} from 'react';
import {assetUrl} from './runtime';
function readVolume(){const raw=storage.getItem('orbita-audio-volume');const n=raw===null?.28:Number(raw);return Number.isFinite(n)?Math.max(0,Math.min(.6,n)):.28;}
export default function Ambient(){
 const [enabled,setEnabled]=useState(()=>storage.getItem('orbita-audio-enabled')!=='false');
 const [playing,setPlaying]=useState(false),[volume,setVolume]=useState(readVolume);
 const audio=useRef<HTMLAudioElement|null>(null),wanted=useRef(enabled);wanted.current=enabled;
 useEffect(()=>{
 let alive=true;
 const a=new Audio(assetUrl('/audio/eternity-stellardrone.m4a'));a.loop=true;a.preload='metadata';a.volume=readVolume();audio.current=a;
 const update=()=>{if(alive)setPlaying(!a.paused&&!a.ended);};a.addEventListener('playing',update);a.addEventListener('pause',update);a.addEventListener('error',update);
 const start=()=>{if(wanted.current)void a.play().catch(()=>{/* Autoplay waits for a real user gesture. */});};
 const gesture=(e:Event)=>{if(!(e.target as HTMLElement)?.closest('.ambient'))start();};
 window.addEventListener('pointerdown',gesture);window.addEventListener('keydown',gesture);window.addEventListener('orbita-audio-start',start);start();
 return()=>{alive=false;window.removeEventListener('pointerdown',gesture);window.removeEventListener('keydown',gesture);window.removeEventListener('orbita-audio-start',start);a.pause();a.removeAttribute('src');a.load();audio.current=null;};
 },[]);
 const toggle=()=>{const next=!enabled;wanted.current=next;setEnabled(next);storage.setItem('orbita-audio-enabled',String(next));if(next)window.dispatchEvent(new Event('orbita-audio-start'));else audio.current?.pause();};
 return <div className="ambient" data-audio-playing={playing}><button onClick={toggle} aria-pressed={enabled} title="Stellardrone — Eternity · из присланного файла">{enabled?'♫ Музыка: вкл.':'♫ Музыка: выкл.'}</button>{enabled&&<input aria-label="Громкость музыки" type="range" min="0" max=".6" step=".01" value={volume} onChange={e=>{const v=+e.target.value;setVolume(v);storage.setItem('orbita-audio-volume',String(v));if(audio.current)audio.current.volume=v;}}/>}</div>;
}
