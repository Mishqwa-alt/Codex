// Local files, private windows and sandboxed previews may deny localStorage.
// Preferences remain usable in memory when persistence is unavailable.
const memory=new Map<string,string>();
export const storage={
 getItem(key:string):string|null{try{return localStorage.getItem(key);}catch{return memory.get(key)??null;}},
 setItem(key:string,value:string){memory.set(key,value);try{localStorage.setItem(key,value);}catch{/* session-only preference */}}
};
