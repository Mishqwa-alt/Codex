import {test,expect} from '@playwright/test';
test('static website uses saved data without a local backend',async({page})=>{
 const unexpected:string[]=[];page.on('request',r=>{if(r.url().includes('/api/'))unexpected.push(r.url());});
 await page.goto('http://127.0.0.1:4173/Codex/');await expect(page.getByRole('dialog')).toContainText('Автономная карта');await page.getByRole('button',{name:'Открыть карту',exact:true}).click();await expect(page.locator('.status-badge')).toHaveCount(0);await expect(page.locator('.ephemeris-value')).toBeVisible();expect(unexpected).toEqual([]);
 await page.getByRole('button',{name:'Осмотреть в 3D ↗'}).click();await expect(page.locator('.model-inspector')).toHaveAttribute('data-model-ready','true');
});
test('single HTML runs with opaque origin and no supporting asset requests',async({page})=>{
 test.setTimeout(90000);const requests:string[]=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(new URL(r.url()).pathname);});
 await page.goto('http://127.0.0.1:4173/sandbox');const f=page.frameLocator('#portable');await expect(f.getByRole('dialog')).toContainText('Автономная карта',{timeout:60000});await f.getByRole('button',{name:'Открыть карту',exact:true}).click();await expect(f.locator('.ambient')).toHaveAttribute('data-audio-playing','true',{timeout:30000});await f.getByRole('button',{name:'Осмотреть в 3D ↗'}).click();await expect(f.locator('.model-inspector')).toHaveAttribute('data-model-ready','true',{timeout:45000});expect(requests.filter(p=>!['/sandbox','/Orbita.html','/favicon.ico'].includes(p))).toEqual([]);
});
