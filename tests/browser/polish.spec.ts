import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/ephemeris/**',r=>r.fulfill({status:502,json:{code:'source_unavailable',error:'offline'}}));});
test('welcome introduces the map and first gesture starts enabled music',async({page})=>{
 await page.goto('/');await expect(page.getByRole('dialog')).toContainText('Добро пожаловать');
 await expect(page.locator('.ambient button')).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Открыть карту',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('.ambient')).toHaveAttribute('data-audio-playing','true');
 await page.locator('.ambient button').click();await expect(page.locator('.ambient button')).toHaveAttribute('aria-pressed','false');
 await page.reload();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.ambient button')).toHaveAttribute('aria-pressed','false');
});
test('header is simplified, reading links are short and information has one entry',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('orbita-welcome-seen','true'));await page.goto('/');
 await expect(page.getByRole('button',{name:'О данных',exact:true})).toHaveCount(0);await expect(page.getByLabel('Информация о карте')).toBeVisible();
 await expect(page.getByRole('link',{name:'Читать',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Смотреть',exact:true})).toBeVisible();
 await page.getByLabel('Информация о карте').click();await expect(page.getByRole('dialog')).toContainText('Как устроена');
});
test('global mission search remains useful while inspecting a planet',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('orbita-welcome-seen','true'));await page.goto('/');
 await page.getByLabel('Рассмотреть планету').selectOption('earth');await page.getByLabel('Поиск миссий').fill('Parker');
 await expect(page.locator('.mission-row')).toHaveCount(1);await page.locator('.mission-row').click();await expect(page.locator('.detail h2')).toHaveText('Parker Solar Probe');
});
