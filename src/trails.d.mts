import type {Mission,Ephemeris} from './types';
export function missionTrail(mission:Mission,data:Ephemeris|undefined,date:Date):{kind:string;points:number[][]};
