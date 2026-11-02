import { test, expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/ephemeris/**',r=>r.fulfill({status:502,json:{error:'Источник временно недоступен'}}));await page.goto('/');});
test('WebGL map renders, fallback estimate and mission catalog remain useful offline',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.locator('canvas')).toBeVisible();
 await expect(page.locator('.ephemeris-box')).toContainText('Грубая экстраполяция');
 await expect(page.locator('.estimate-label').filter({hasText:'Voyager 1'})).toBeVisible();
 await expect(page.locator('.mission-row')).toHaveCount(48);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
 await page.screenshot({path:'/tmp/orbita-desktop.png'});
});
test('search and filters find rover, card presents history and agency',async({page})=>{
 await page.getByRole('textbox',{name:'Поиск миссий'}).fill('Perseverance');
 await expect(page.locator('.mission-row')).toHaveCount(1);
 await page.locator('.mission-row').click();
 await expect(page.locator('.detail h2')).toHaveText('Perseverance');
 await expect(page.locator('.agency-label')).toContainText('NASA');
 await expect(page.locator('.estimate-box')).toContainText('Район Марса');
 await page.getByRole('textbox',{name:'Поиск миссий'}).fill('xyz-no-mission');
 await expect(page.getByText('Ничего не найдено')).toBeVisible();
 await page.getByRole('button',{name:'Сбросить фильтры'}).click();
 await expect(page.locator('.mission-row')).toHaveCount(48);
});
test('bookmarks persist and shared mission URL restores selection',async({page})=>{
 await page.getByRole('button',{name:'Добавить в избранное',exact:true}).click();
 await page.reload();await expect(page.getByRole('button',{name:'Убрать из избранного'})).toBeVisible();
 await page.goto('/?mission=curiosity&date=2027-03-01');
 await expect(page.locator('.detail h2')).toHaveText('Curiosity');
 await expect(page.getByLabel('Дата симуляции UTC')).toHaveValue('2027-03-01');
});
test('date, layer switches and scientific methodology work',async({page})=>{
 await page.getByLabel('Дата симуляции UTC').fill('2027-01-01');
 await page.getByRole('button',{name:'На день вперёд'}).click();
 await expect(page.getByLabel('Дата симуляции UTC')).toHaveValue('2027-01-02');
 await page.getByRole('button',{name:'Слои и масштаб',exact:true}).click();
 await page.getByLabel('Названия планет и аппаратов').uncheck();
 await page.getByLabel('Масштаб расстояний').selectOption('linear');
 await page.getByRole('button',{name:'Закрыть',exact:true}).click();
 await expect(page.locator('.map-coordinate')).toContainText('Линейные');
 await expect(page.locator('.estimate-label')).toHaveCount(0);
 await page.getByRole('button',{name:'О данных',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('48 миссий');
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('real vectors take priority over estimates and expose provenance',async({page})=>{
 await page.unroute('**/api/ephemeris/**');
 await page.route('**/api/ephemeris/**',r=>r.fulfill({json:{id:'voyager-1',target:'Voyager 1 (-31)',epoch:new Date(new Date().setUTCMinutes(0,0,0)).toISOString(),fetchedAt:Date.now(),points:[{jd:2461346.5,position:[100,20,30],velocity:[.001,.002,.003]},{jd:2461351.5,position:[101,20,30],velocity:[.001,.002,.003]}],frame:'ICRF / Ecliptic J2000',center:'Sun',units:'AU, AU/day',timeScale:'UT',forecast:true,source:'NASA/JPL Horizons',requestUrl:'https://ssd.jpl.nasa.gov/api/horizons.api',statusVerified:false}}));
 await page.reload();await expect(page.getByRole('button',{name:'Найти на карте'})).toBeVisible();
 await expect(page.locator('.estimate-label').filter({hasText:'Voyager 1'})).toHaveCount(0);
 await page.getByRole('button',{name:'Траектория',exact:true}).click();
 await expect(page.locator('.detail-content')).toContainText('ГЕЛИОЦЕНТРИЧЕСКАЯ СКОРОСТЬ');
 await expect(page.getByRole('button',{name:'Скачать векторы JSON'})).toBeVisible();
});
test('mobile catalog and detail remain accessible without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Каталог · 48'}).click();
 await page.getByRole('textbox',{name:'Поиск миссий'}).fill('James Webb');
 await page.locator('.mission-row').click();
 await expect(page.locator('.detail h2')).toHaveText('James Webb');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/orbita-mobile.png',fullPage:true});
});
test('API health and input validation work independently of upstream',async({request})=>{
 const health=await request.get('/api/health');expect(health.ok()).toBe(true);expect((await health.json()).missions).toBe(48);
 expect((await request.get('/api/ephemeris/not-a-mission')).status()).toBe(404);
 expect((await request.get('/api/ephemeris/perseverance')).status()).toBe(422);
 expect((await request.get('/api/ephemeris/voyager-1?date=bad')).status()).toBe(400);
 expect((await request.get('/api/ephemeris/voyager-1?date=2026-02-31')).status()).toBe(400);
});
