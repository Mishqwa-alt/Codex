import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',fullyParallel:false,workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:3000',viewport:{width:1512,height:982},launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']}},reporter:'list'});
