import {planets,planetPosition} from './orbits.mjs';
// Deliberately coarse editorial cruise models, NOT a fitted navigation solution.
// Rounded 2024 distance anchors and approximate outbound sky directions.
// Primary mission background: https://science.nasa.gov/mission/voyager/
// https://science.nasa.gov/mission/new-horizons/
const cruise={
 'voyager-1':{r:163,speed:3.6,ra:258.5,dec:12},
 'voyager-2':{r:136,speed:3.2,ra:299.25,dec:-58},
 'new-horizons':{r:58,speed:2.9,ra:289.25,dec:-20.5}
};
export function estimateMission(mission,date){
 const c=cruise[mission.id];
 if(c&&date.getUTCFullYear()>=2024&&date.getUTCFullYear()<=2035){
 const years=(+date-Date.UTC(2024,0,1))/(365.25*86400000),r=c.r+c.speed*years;
 const ra=c.ra*Math.PI/180,dec=c.dec*Math.PI/180,eps=23.43928*Math.PI/180;
 const direction=[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra)*Math.cos(eps)+Math.sin(dec)*Math.sin(eps),-Math.cos(dec)*Math.sin(ra)*Math.sin(eps)+Math.sin(dec)*Math.cos(eps)];
 return {position:direction.map(v=>v*r),label:'Грубая экстраполяция',method:'Прямолинейный радиальный полёт: округлённая дальность на 2024 год, средняя скорость удаления и приблизительное направление. Модель не сверена с текущей эфемеридой; численная погрешность не установлена.',approximate:true};
 }
 const anchor=planets.find(p=>p.id===mission.anchor);
 if(anchor&&mission.anchor!=='sun'&&+date>=+new Date(mission.launch)){
 const transfer=mission.id==='bepicolombo';
 if(transfer)return {position:null,label:'Область перелёта к Меркурию',method:'Текущий участок перелёта неизвестен; показана область внутренней системы, не координата аппарата.',approximate:true};
 return {position:planetPosition(anchor,date),label:`Район ${mission.anchor==='mars'?'Марса':mission.anchor==='jupiter'?'Юпитера':'Земли'}`,method:'Показано положение планеты по модели JPL, а не индивидуальная орбита аппарата. Для лунных миссий и L2 это лишь окрестность системы Земли.',approximate:true};
 }
 return {position:null,label:'Область межпланетного перелёта',method:'Направление и текущая дальность не подтверждены. Подсветка обозначает область исследования, а не положение аппарата.',approximate:true};
}
