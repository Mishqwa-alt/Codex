import { fetch, ProxyAgent } from 'undici';
const proxy=process.env.HTTPS_PROXY || process.env.https_proxy;
const dispatcher=proxy ? new ProxyAgent(proxy) : undefined;
export function parseVectors(text,expectedTarget){
 const target=text.match(/Target body name:\s*([^\r\n]+)/)?.[1]?.trim();
 if(!target || !(expectedTarget.endsWith(';')?new RegExp('^'+expectedTarget.slice(0,-1)+'\\s').test(target):target.includes(`(${expectedTarget})`))) throw new Error('Horizons вернул другой объект; данные отклонены.');
 const block=text.split('$$SOE')[1]?.split('$$EOE')[0];
 if(!block) throw new Error('На выбранную дату эфемериды отсутствуют.');
 const points=block.trim().split('\n').filter(Boolean).map(line=>{
 const cols=line.split(',').map(s=>s.trim());
 const values=[cols[0],...cols.slice(2,8)].map(v=>Number(v?.replace(/[dD]/g,'E')));
 if(values.length!==7 || !values.every(Number.isFinite))throw new Error('Некорректный формат векторов Horizons.');
 return {jd:values[0],position:values.slice(1,4),velocity:values.slice(4,7)};
 });
 if(!points.length)throw new Error('Horizons не вернул векторов.');
 return {target,points};
}
let previous=Promise.resolve();
export function getVectors(target,date,forecast=true){
 const task=previous.then(()=>requestVectors(target,date,forecast));
 previous=task.catch(()=>{});return task;
}
async function requestVectors(target,date,forecast=true){
 const end=new Date(date.getTime()+(forecast?180:1)*86400000);
 const stamp=d=>d.toISOString().slice(0,16).replace('T',' ');
 const args={format:'json',COMMAND:`'${target}'`,OBJ_DATA:"'YES'",MAKE_EPHEM:"'YES'",EPHEM_TYPE:"'VECTORS'",CENTER:"'500@10'",START_TIME:`'${stamp(date)}'`,STOP_TIME:`'${stamp(end)}'`,STEP_SIZE:forecast?"'5 d'":"'1 d'",OUT_UNITS:"'AU-D'",CSV_FORMAT:"'YES'",VEC_TABLE:"'2'",VEC_CORR:"'NONE'",REF_PLANE:"'ECLIPTIC'",REF_SYSTEM:"'ICRF'",TIME_TYPE:"'UT'"};
 if(!forecast){delete args.START_TIME;delete args.STOP_TIME;delete args.STEP_SIZE;args.TLIST=`'${date.getTime()/86400000+2440587.5}'`;args.TLIST_TYPE="'JD'";}
 const url='https://ssd.jpl.nasa.gov/api/horizons.api?'+new URLSearchParams(args);
 let response;try{response=await fetch(url,{dispatcher,signal:AbortSignal.timeout(20000)});}catch(cause){const error=new Error('Не удалось связаться с NASA/JPL. Доступна приближённая модель.');error.connectionFailure=true;throw error;}
 if(!response.ok){const error=new Error(`Источник NASA/JPL недоступен (HTTP ${response.status}). Доступна приближённая модель.`);error.httpStatus=response.status;throw error;}
 const data=await response.json();
 if(data.error)throw new Error(String(data.error).slice(0,400));
 return {...parseVectors(data.result || '',target),requestUrl:url};
}
