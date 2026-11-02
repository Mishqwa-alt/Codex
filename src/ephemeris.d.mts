import type {Ephemeris} from './types';
export function positionAt(data:Ephemeris|undefined,date:Date):number[]|null;
export function fiveMinuteBucket(date:Date):Date;
export function propagate(position:number[],velocity:number[],days:number):number[]|null;
export function missionPositionAt(mission:{anchor:string},data:Ephemeris|undefined,date:Date):number[]|null;
