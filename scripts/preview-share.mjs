import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
const root=path.resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.m4a':'audio/mp4'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/sandbox'){res.setHeader('Content-Type','text/html');res.end('<iframe id="portable" sandbox="allow-scripts allow-downloads" src="/Orbita.html" style="border:0;width:100vw;height:100vh"></iframe>');return;}
 const standalone=url.pathname==='/Orbita.html',base=standalone?path.join(root,'release'):path.join(root,'docs');
 const relative=standalone?'Orbita.html':decodeURIComponent(url.pathname.replace(/^\/Codex\/?/,''))||'index.html';
 const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep))throw Error('Invalid path');
 const bytes=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Content-Length',bytes.length);res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'0.0.0.0',()=>console.log('Share preview: 4173/Codex/'));
