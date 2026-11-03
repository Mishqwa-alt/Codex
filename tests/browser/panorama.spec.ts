import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('orbita-welcome-seen','true'));await page.route('**/api/ephemeris/**',r=>r.fulfill({status:502,json:{code:'source_unavailable',error:'offline'}}));await page.goto('/');});
test('independent panels leave a full panorama and reopen',async({page})=>{
 await page.getByLabel('Свернуть список миссий').click();await expect(page.locator('.catalog')).toBeHidden();await expect(page.locator('.detail')).toBeVisible();
 await page.getByLabel('Свернуть описание миссии').click();await expect(page.locator('.detail')).toBeHidden();
 await page.getByRole('button',{name:'Миссии ›',exact:true}).click();await expect(page.locator('.catalog')).toBeVisible();
 await page.getByRole('button',{name:'‹ О миссии',exact:true}).click();await expect(page.locator('.detail')).toBeVisible();
});
test('mission layers, country filters and simple help are available',async({page})=>{
 await page.getByLabel('Страны-участники').selectOption('Япония');await expect(page.locator('.mission-row')).not.toHaveCount(48);
 await page.getByRole('button',{name:'Слои и масштаб',exact:true}).click();await page.getByLabel('Отображение миссий').selectOption('off');await page.getByLabel('Какие траектории показывать').selectOption('selected');await page.getByRole('button',{name:'Закрыть',exact:true}).click();
 await expect(page.locator('.craft-label,.estimate-label,.cluster')).toHaveCount(0);
 await page.getByRole('button',{name:'Управление',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Пробел');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Информация о карте',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('a = −μ');
});
test('future Psyche remains located from known vectors and its destination is visible',async({page})=>{
 const epoch=new Date();epoch.setUTCHours(0,0,0,0);
 const fixture=(id:string)=>({id,target:id,epoch:epoch.toISOString(),fetchedAt:Date.now(),points:[{jd:1,position:[id==='psyche'?2:2.92,.1,0],velocity:[0,.01,0]}],frame:'J2000',center:'Sun',units:'AU',timeScale:'UT',forecast:false,source:'NASA/JPL Horizons',requestUrl:'https://ssd.jpl.nasa.gov/',statusVerified:false});
 await page.route('**/api/ephemeris/psyche**',r=>r.request().url().includes('?date=')?r.fulfill({status:502,json:{code:'no_ephemeris',error:'outside coverage'}}):r.fulfill({json:fixture('psyche')}));
 await page.route('**/api/ephemeris/dest-psyche**',r=>r.fulfill({json:fixture('dest-psyche')}));
 await page.getByLabel('Поиск миссий').fill('Psyche');await expect(page.locator('.mission-row')).toHaveCount(1);await page.locator('.mission-row').click();
 const future=new Date(+epoch+365*86400000);await page.getByLabel('Дата симуляции UTC').fill(future.toISOString().slice(0,10));
 await expect(page.locator('.ephemeris-value')).toBeVisible();await expect(page.locator('.destination-label')).toContainText('Психея');
});
test('right click is inert and home returns to system',async({page})=>{
 await page.getByLabel('Рассмотреть планету').selectOption('mars');await expect(page.locator('.planet-focus-info')).toContainText('Марс');
 await page.getByLabel('Рассмотреть планету').selectOption('earth');await page.locator('.space-canvas canvas').click({button:'right',position:{x:10,y:10}});await expect(page.getByLabel('Рассмотреть планету')).toHaveValue('earth');
 await page.keyboard.press('Backspace');await expect(page.getByLabel('Рассмотреть планету')).toHaveValue('');
});
