const automator=require('miniprogram-automator');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {templates}=require('../.build/miniprogram/utils/catalog');
(async()=>{
 const mini=await automator.connect({wsEndpoint:process.env.WECHAT_WS||'ws://127.0.0.1:9420'});
 const dir=path.resolve(__dirname,'../artifacts/layouts');fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await mini.reLaunch('/pages/preview/preview?template=classic');
  for(const template of templates.slice(0,32)){
   await page.callMethod('setTemplate',template);await page.waitFor(300);
   const paper=await page.$('resume-paper'),data=await paper.data();
   assert.equal(data.resolved.style,template.style);
   const children=await paper.$$('resume-section');
   assert.equal(children.length,5,template.id+'：章节数量');
   let total=0;
   for(const child of children){const node=await child.$('.section');const size=await node.size();assert.ok(size.width>20&&size.height>10,template.id+'：章节尺寸');total+=size.height;}
   await mini.callWxMethod('pageScrollTo',{selector:'.preview-sheet',duration:0});await page.waitFor(150);
   await mini.screenshot({path:path.join(dir,template.id+'.png')});
   console.log(template.name+'：五个章节均可见，累计高度 '+Math.round(total));
  }
 }finally{await mini.switchTab('/pages/index/index');await mini.disconnect();}
})().catch(error=>{console.error(error);process.exitCode=1;});

