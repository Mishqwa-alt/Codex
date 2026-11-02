import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planets,planetPosition,scenePosition} from '../src/orbits.mjs';
import {estimateMission} from '../src/estimates.mjs';
import {parseVectors} from '../server/horizons.mjs';
const missions=JSON.parse(await readFile(new URL('../src/data/missions.json',import.meta.url),'utf8'));
test('Earth–Moon barycenter at J2000 agrees with JPL worked example',()=>{
 const earth=planets.find(p=>p.id==='earth');
 const v=planetPosition(earth,new Date('2000-01-01T12:00:00Z'));
 const expected=[-.1771712491,.9672144849,-.0000002584];
 v.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<.00002,`${i}: ${x}`));
});
test('all planet radii stay within orbital apsides and model rejects unsupported dates',()=>{
 for(const p of planets){for(const date of ['2000-01-01','2026-11-02','2049-01-01']){
 const r=Math.hypot(...planetPosition(p,new Date(date)));assert.ok(r>p.a*(1-p.e)-.03 && r<p.a*(1+p.e)+.03);
 }}assert.throws(()=>planetPosition(planets[0],new Date('2100-01-01')),RangeError);
});
test('display conversion preserves axis orientation and logarithmic radial ordering',()=>{
 assert.deepEqual(scenePosition([0,1,0],'linear'),[0,0,-.34]);
 assert.deepEqual(scenePosition([0,0,1],'linear'),[0,.34,-0]);
 assert.ok(Math.hypot(...scenePosition([100,0,0]))>Math.hypot(...scenePosition([30,0,0])));
});
test('coarse estimates never turn planetary districts into precise spacecraft orbits',()=>{
 const rover=missions.find(m=>m.id==='perseverance'),date=new Date('2026-11-02');
 const e=estimateMission(rover,date);assert.equal(e.approximate,true);
 assert.deepEqual(e.position,planetPosition(planets.find(p=>p.id==='mars'),date));
 const cruise=estimateMission(missions.find(m=>m.id==='voyager-1'),date);
 assert.ok(Math.hypot(...cruise.position)>160);assert.match(cruise.method,/не установлена/);
 assert.equal(estimateMission(missions.find(m=>m.id==='psyche'),date).position,null);
});
test('Horizons parser checks identity and converts AU vectors and velocity',()=>{
 const fixture='Target body name: Voyager 1 (-31)\n$$SOE\n2461346.5, A.D. 2026-Nov-02 00:00:00, 1.0D+02, -2, 3, .001, .002, .003,\n$$EOE';
 const r=parseVectors(fixture,'-31');assert.equal(r.points.length,1);assert.deepEqual(r.points[0].position,[100,-2,3]);assert.deepEqual(r.points[0].velocity,[.001,.002,.003]);
 assert.throws(()=>parseVectors(fixture,'-32'),/другой объект/);
 assert.throws(()=>parseVectors('Target body name: Voyager 1 (-31)','-31'),/отсутствуют/);
 assert.throws(()=>parseVectors(fixture.replace('1.0D+02','NaN'),'-31'),/формат/);
});
test('catalog has unique IDs, official HTTPS source URLs and explicit unverified statuses',()=>{
 assert.equal(new Set(missions.map(m=>m.id)).size,missions.length);
 for(const m of missions){assert.equal(new URL(m.source).protocol,'https:');assert.equal(m.statusVerified,false);assert.ok(Number.isFinite(+new Date(m.launch)));}
});

test('vector propagation is bounded, uses AU/day and rejects stale epochs',async()=>{
 const {positionAt}=await import('../src/ephemeris.mjs');
 const data={epoch:'2026-11-02T00:00:00Z',points:[{position:[1,2,3],velocity:[.024,0,0]}]};
 assert.deepEqual(positionAt(data,new Date('2026-11-02T01:00:00Z')),[1.001,2,3]);
 assert.equal(positionAt(data,new Date('2026-11-03T00:00:00Z')),null);
 assert.equal(positionAt(undefined,new Date()),null);
});
test('five-minute cache epochs preserve UTC date and bound age',async()=>{
 const {fiveMinuteBucket}=await import('../src/ephemeris.mjs');
 assert.equal(fiveMinuteBucket(new Date('2026-11-02T23:59:59Z')).toISOString(),'2026-11-02T23:55:00.000Z');
});
test('bundled NASA assets match SHA-256 manifest and contain no external resources',async()=>{
 const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(await readFile(new URL('../public/assets-manifest.json',import.meta.url),'utf8'));
 assert.equal(manifest.assets.filter(a=>a.path.endsWith('.glb')).length,17);
 for(const asset of manifest.assets){
 const bytes=await readFile(new URL('../public/'+asset.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 if(asset.path.endsWith('.glb')){assert.equal(bytes.toString('ascii',0,4),'glTF');const data=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));for(const v of [...(data.images||[]),...(data.buffers||[])])assert.ok(!v.uri||v.uri.startsWith('data:'));}
 }
 const decoder=await readFile(new URL('../public/draco/draco_decoder.wasm',import.meta.url));assert.ok(decoder.length>100000);
});
