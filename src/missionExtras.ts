import resources from './data/resources.json';
import type {Mission} from './types';
export const countries=(m:Mission):string[]=>{
 const a=m.agency,out:string[]=[];
 if(/NASA|MIT|SwRI|Caltech/.test(a))out.push('США');if(/JAXA|CAS/.test(a)&&/JAXA/.test(a))out.push('Япония');if(/CNSA|CAS/.test(a))out.push('Китай');if(/ISRO/.test(a))out.push('Индия');if(/KARI/.test(a))out.push('Южная Корея');if(/MBRSC|UAE/.test(a))out.push('ОАЭ');if(/Роскосмос/.test(a))out.push('Россия');if(/CSA/.test(a))out.push('Канада');if(/CNES/.test(a))out.push('Франция');if(/ASI/.test(a))out.push('Италия');if(/UKSA/.test(a))out.push('Великобритания');if(/MPE/.test(a))out.push('Германия');if(/ESA/.test(a))out.push('Европа (ESA)');
 return out;
};
export const destinations:Record<string,{body?:string;name:string;arrival?:string}>={psyche:{body:'dest-psyche',name:'Астероид Психея',arrival:'2029-08-01'},juice:{body:'jupiter',name:'Юпитер / Ганимед',arrival:'2031-07-01'},'europa-clipper':{body:'jupiter',name:'Юпитер / Европа',arrival:'2030-04-01'},bepicolombo:{body:'mercury',name:'Меркурий',arrival:'2026-12-01'},'osiris-apex':{body:'dest-apophis',name:'Апофис',arrival:'2029-04-13'},hera:{body:'dest-didymos',name:'Дидим / Диморф',arrival:'2026-12-31'},lucy:{name:'Троянские астероиды Юпитера'},'hayabusa2':{name:'1998 KY26'},'tianwen-2':{name:'Камоалева'}};
const ru:Record<string,string>={'voyager-1':'Вояджер-1','voyager-2':'Вояджер-2',jwst:'Джеймс Уэбб (телескоп)',hubble:'Хаббл (телескоп)',parker:'Паркер (солнечный зонд)','solar-orbiter':'Solar Orbiter',psyche:'Психея (космический аппарат)',perseverance:'Персеверанс',curiosity:'Кьюриосити','new-horizons':'Новые горизонты',juno:'Юнона (космический аппарат)'};
export const russianArticle=(m:Mission)=>(resources as Record<string,{article:string}>)[m.id]?.article||'https://ru.wikipedia.org/w/index.php?search='+encodeURIComponent(ru[m.id]||m.name.split(' ·')[0]);
export const russianVideos=(m:Mission)=>'https://www.youtube.com/results?search_query='+encodeURIComponent((ru[m.id]||m.name)+' космическая миссия на русском');
