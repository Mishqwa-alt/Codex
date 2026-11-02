import {useEffect,useRef,useState} from 'react';
function readVolume(){const raw=localStorage.getItem('orbita-audio-volume');const n=raw===null?.28:Number(raw);return Number.isFinite(n)?Math.max(0,Math.min(.6,n)):.28;}
export default function Ambient(){
 const [enabled,setEnabled]=useState(()=>localStorage.getItem('orbita-audio-enabled')!=='false');
 const [playing,setPlaying]=useState(false),[volume,setVolume]=useState(readVolume);
 const audio=useRef<AudioContext|null>(null),master=useRef<GainNode|null>(null),wanted=useRef(enabled);wanted.current=enabled;
 useEffect(()=>{
 let alive=true,timer:ReturnType<typeof setInterval>|undefined,next=0,index=0;
 const start=()=>{
 if(!wanted.current)return;
 if(!audio.current){
 const a=new AudioContext();audio.current=a;const gain=a.createGain();gain.gain.value=0;gain.connect(a.destination);master.current=gain;
 const delay=a.createDelay(2),feedback=a.createGain(),filter=a.createBiquadFilter();delay.delayTime.value=.6;feedback.gain.value=.16;filter.type='lowpass';filter.frequency.value=1800;delay.connect(filter).connect(feedback).connect(delay);filter.connect(gain);
 // Quiet C-major pads, no sub-bass or dissonant drone. Original browser synthesis.
 [130.8128,164.8138,195.9977,261.6256].forEach((frequency,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=0;g.gain.linearRampToValueAtTime(.005,a.currentTime+5+i);o.connect(g).connect(gain);o.start();});
 const notes=[261.6256,329.6276,391.9954,440,523.2511],pattern=[0,2,1,4,2,3,1,2,0,3,2,4];next=a.currentTime+1;
 const schedule=()=>{while(next<a.currentTime+5){const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=notes[pattern[index++%pattern.length]];g.gain.setValueAtTime(0,next);g.gain.linearRampToValueAtTime(.025,next+.07);g.gain.exponentialRampToValueAtTime(.0001,next+3.5);o.connect(g);g.connect(gain);g.connect(delay);o.start(next);o.stop(next+3.6);o.onended=()=>{o.disconnect();g.disconnect();};next+=3.5+(index%3)*.75;}};
 schedule();timer=setInterval(schedule,1000);
 }
 const a=audio.current;void a.resume().then(()=>{if(alive&&wanted.current){master.current?.gain.setTargetAtTime(readVolume(),a.currentTime,1.2);setPlaying(a.state==='running');}}).catch(()=>{/* Browser will retry on the first gesture. */});
 };
 const gesture=(e:Event)=>{if((e.target as HTMLElement)?.closest('.ambient'))return;start();};
 window.addEventListener('pointerdown',gesture);window.addEventListener('keydown',gesture);window.addEventListener('orbita-audio-start',start);start();
 return()=>{alive=false;window.removeEventListener('pointerdown',gesture);window.removeEventListener('keydown',gesture);window.removeEventListener('orbita-audio-start',start);if(timer)clearInterval(timer);void audio.current?.close();audio.current=null;};
 },[]);
 const toggle=()=>{const next=!enabled;wanted.current=next;setEnabled(next);localStorage.setItem('orbita-audio-enabled',String(next));if(next)window.dispatchEvent(new Event('orbita-audio-start'));else{if(audio.current){master.current?.gain.setTargetAtTime(0,audio.current.currentTime,.15);void audio.current.suspend();}setPlaying(false);}};
 return <div className="ambient" data-audio-playing={playing}><button onClick={toggle} aria-pressed={enabled} title={enabled&&!playing?'Музыка начнётся после первого нажатия на карту':undefined}>{enabled?'♫ Музыка: вкл.':'♫ Музыка: выкл.'}</button>{enabled&&<input aria-label="Громкость музыки" type="range" min="0" max=".6" step=".01" value={volume} onChange={e=>{const v=+e.target.value;setVolume(v);localStorage.setItem('orbita-audio-volume',String(v));if(audio.current)master.current?.gain.setTargetAtTime(v,audio.current.currentTime,.2);}}/>}</div>;
}
