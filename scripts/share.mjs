import {build} from 'vite';
import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const root=path.resolve(import.meta.dirname,'..');
process.env.VITE_STATIC='true';process.env.STATIC_BASE='/Codex/';process.env.BUILD_DIR='docs';
await build({root});await writeFile(path.join(root,'docs/.nojekyll'),'');
process.env.STATIC_BASE='./';process.env.BUILD_DIR='.cache/portable-build';process.env.SINGLE_FILE='1';
await build({root,publicDir:false});
const temp=path.join(root,'.cache/portable-build');
let html=await readFile(path.join(temp,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
const sheets=[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g)].map(m=>m[1]);
if(scripts.length!==1)throw new Error('Expected one portable JS bundle');
let js=await readFile(path.join(temp,scripts[0]),'utf8');
let css='';for(const file of sheets)css+=await readFile(path.join(temp,file),'utf8');
const mime={'.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.js':'text/javascript','.wasm':'application/wasm','.json':'application/json','.m4a':'audio/mp4','.txt':'text/plain','.md':'text/plain'};
const assets={};
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())await walk(full);else{const key='/'+path.relative(path.join(root,'public'),full).split(path.sep).join('/');assets[key]={type:mime[path.extname(full)]||'application/octet-stream',base64:(await readFile(full)).toString('base64')};}}}
await walk(path.join(root,'public'));
const payload=gzipSync(Buffer.from(JSON.stringify(assets)),{level:9}).toString('base64');
const bootstrap=`
const compressed=Uint8Array.from(atob(${JSON.stringify(payload)}),c=>c.charCodeAt(0));
const decoded=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
const entries=JSON.parse(decoded);window.__ORBITA_ASSETS__={};
for(const [name,item] of Object.entries(entries)){const bytes=Uint8Array.from(atob(item.base64),c=>c.charCodeAt(0));window.__ORBITA_ASSETS__[name]=URL.createObjectURL(new Blob([bytes],{type:item.type}));}
const originalFetch=window.fetch.bind(window);window.fetch=(input,init)=>{const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;let match;try{const pathname=new URL(raw,location.href).pathname;match=Object.keys(window.__ORBITA_ASSETS__).find(p=>pathname.endsWith(p));}catch{}return originalFetch(match?window.__ORBITA_ASSETS__[match]:input,init);};
`;
html=html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/g,'').replace(/<link\b[^>]*(?:rel="stylesheet"|rel="modulepreload")[^>]*>/g,'');
html=html.replace('</head>',()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style></head>`);
const full=`(async()=>{try{${bootstrap}\n${js}\n}catch(error){document.getElementById('root').textContent='Не удалось открыть автономную карту: '+error.message;console.error(error);}})();`;
html=html.replace('</body>',()=>`<script>${full.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await mkdir(path.join(root,'release'),{recursive:true});await writeFile(path.join(root,'release/Orbita.html'),html);
await rm(temp,{recursive:true,force:true});
console.log('Standalone HTML:',(Buffer.byteLength(html)/1024/1024).toFixed(1),'MiB;',Object.keys(assets).length,'embedded assets');
