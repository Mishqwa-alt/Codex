export interface Planet {id:string;name:string;color:string;size:number;a:number;e:number;i:number;L:number;p:number;n:number;r:number[]}
export const planets: Planet[];
export function planetPosition(body:Planet,date:Date,anomaly?:number):[number,number,number];
export function scenePosition(v:number[],scale?:string):[number,number,number];
export const auKm:number;
