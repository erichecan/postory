/* Browser evidence: 19 artboards, responsive boundaries, edits, upload and actual PNG download. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'docs/demo-v2/fidelity-shots');
const base=process.env.DEMO_URL||'http://localhost:3002';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/demo-v2/pixel-reference/manifest.json')));
const routes=['/demo/nails','/demo/nails/upload','/demo/nails/preview','/demo/nails/templates','/demo/nails/edit','/demo/nails/success','/demo/nails/dashboard','/demo/nails/content','/demo/nails/accounts','/demo/nails/calendar','/demo/nails/schedule','/demo/sushi','/demo/sushi/upload','/demo/sushi/templates','/demo/sushi/edit','/demo/sushi/preview','/demo/sushi/schedule','/demo/sushi/success','/demo/sushi/export'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||path.join(root,'.playwright-browsers/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];const broken=[];const results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/demo/fidelity/'))broken.push(r.url());});
 for(let i=0;i<routes.length;i++){
   const response=await page.goto(base+routes[i]+'?reference=1');assert.equal(response.status(),200,routes[i]);
   await page.locator('[data-ready="true"]').waitFor({timeout:45000});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});
   await page.screenshot({path:path.join(out,`${String(i+1).padStart(2,'0')}.png`),fullPage:true});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false,routes[i]);
   results.push({id:i+1,route:routes[i],viewport:'390x844',status:response.status(),overflow});console.log('SHOT',i+1,routes[i]);
 }
 for(const width of [320,430]){
   await page.setViewportSize({width,height:Math.round(width*844/390)});
   for(const route of routes){await page.goto(base+route);await page.locator('[data-ready="true"]').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`${width} ${route}`);}
   console.log('RESPONSIVE',width,'19 passed');
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/demo/nails/upload?reference=1');await page.locator('[data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'移除照片 1',exact:true}).click();await page.getByText('已上传 3/6 张').waitFor();
 await page.locator('input[type=file]').first().setInputFiles(path.join(root,'public/demo/fidelity/nail-photo-2.webp'));await page.getByText('已上传 4/6 张').waitFor();
 await page.getByRole('button',{name:/下一步 · 选择模板/}).click();await page.waitForURL('**/templates?session=*');await page.locator('[data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'选择模板 3',exact:true}).first().click();await page.getByRole('button',{name:/使用这个模板/}).click();await page.waitForURL('**/edit?session=*');await page.locator('[data-ready="true"]').waitFor();
 await page.getByRole('textbox',{name:'标题',exact:true}).fill('像素还原验证');await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.getByRole('status').filter({hasText:'草稿已保存'}).waitFor();
 await page.reload();await page.locator('[data-ready="true"]').waitFor();assert.equal(await page.getByRole('textbox',{name:'标题',exact:true}).inputValue(),'像素还原验证');
 await page.getByRole('button',{name:/预览成品/}).click();await page.waitForURL('**/preview?session=*');await page.locator('[data-ready="true"]').waitFor();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:/导出我的作品/}).click();const download=await downloadPromise;const pngPath=path.join(out,'export-custom.png');await download.saveAs(pngPath);
 const bytes=fs.readFileSync(pngPath);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),1080);assert.equal(bytes.readUInt32BE(20),1440);console.log('FLOW upload/template/edit/save/reload/export PASS',bytes.length);
 await page.goto(base+'/demo/sushi/preview?reference=1');await page.locator('[data-ready="true"]').waitFor();
 await page.getByRole('textbox',{name:'标题',exact:true}).fill('Fresh Sushi Test');
 await page.getByRole('button',{name:/下一步：添加发布时间/}).click();await page.waitForURL('**/export?session=*');await page.locator('[data-ready="true"]').waitFor();
 const sushiDownloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:/下载带有水印的高清图片/}).click();const sushiDownload=await sushiDownloadPromise;const sushiPng=path.join(out,'export-sushi-custom.png');await sushiDownload.saveAs(sushiPng);
 const sushiBytes=fs.readFileSync(sushiPng);assert.equal(sushiBytes.readUInt32BE(16),1080);assert.equal(sushiBytes.readUInt32BE(20),1080);console.log('SUSHI custom text/export PASS',sushiBytes.length);
 await page.goto(base+'/demo/nails/accounts');await page.locator('[data-ready="true"]').waitFor();await page.getByRole('button',{name:'连接账号',exact:true}).click();await page.getByRole('status').filter({hasText:'演示连接已开启'}).waitFor();
 await page.goto(base+'/demo/sushi/schedule');await page.locator('[data-ready="true"]').waitFor();await page.getByRole('button',{name:/确认并安排发布/}).click();await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/不会连接或发布到外部账号/);
 await page.goto(base+'/demo/review');assert.equal(await page.locator('.fd-demo-index-grid a').count(),19);
 assert.deepEqual(errors,[]);assert.deepEqual(broken,[]);
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({timestamp:new Date().toISOString(),results,responsive:[320,390,430],errors,broken,interactionFlow:'passed',export:{width:1080,height:1440,bytes:bytes.length}},null,2));
 for(let i=0;i<manifest.length;i++){manifest[i].currentRoute=routes[i];manifest[i].status='implemented; screenshot captured; visual differences remain';}
 fs.writeFileSync(path.join(root,'docs/demo-v2/pixel-reference/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
