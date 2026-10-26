const automator=require('miniprogram-automator'),assert=require('node:assert/strict'),path=require('node:path');
const {fontDocument}=require('../tests/pdf-fixtures'),{buildResume}=require('../.build/miniprogram/utils/pdf'),{detailed}=require('../tests/fixtures'),{templates}=require('../.build/miniprogram/utils/catalog');
(async()=>{
 const mini=await automator.connect({wsEndpoint:process.env.WECHAT_WS||'ws://127.0.0.1:9436'});let probe;
 mini.on('exception',error=>console.log('运行异常：'+JSON.stringify(error).slice(0,900)));
 mini.on('console',entry=>{if(entry.level==='error')console.log('错误日志：'+JSON.stringify(entry).slice(0,900));});
 try{
  const page=await mini.reLaunch('/pages/profile/profile');assert.equal(await mini.evaluate(()=>getApp().globalData.storageMode),'local');
  assert.equal(page.path,'pages/profile/profile');assert.equal((await page.data()).templateCount,320);console.log('通过：本机简历夹，无账号服务');
  if(process.env.WECHAT_SKIP_SCREENSHOTS!=='1')await mini.screenshot({path:path.resolve(__dirname,'../artifacts/profile-local.png')});
  const entry=await mini.navigateTo('/pages/optimize/optimize');await entry.callMethod('file');
  let reader;for(let n=0;n<80;n++){reader=await mini.currentPage();if(reader.path==='packages/pdf-reader/index/index')break;await new Promise(r=>setTimeout(r,250));}
  assert.equal(reader.path,'packages/pdf-reader/index/index','通过文件入口加载本机解析页面');
  console.log('本机文件页面已加载');
  const cases=[
   {name:'新增栏目',bytes:Buffer.from(buildResume({content:detailed()},templates[0]),'ascii')},
   {name:'压缩中文与本机字库',bytes:fontDocument().bytes},
   {name:'扫描件',bytes:fontDocument({blank:true}).bytes,error:/扫描件/},
   {name:'加密文件',bytes:fontDocument({encrypted:true}).bytes,error:/加密/},
   {name:'超页数',bytes:fontDocument({pageCount:16}).bytes,error:/十五页/},
   {name:'无效文件',bytes:new Uint8Array([1,2,3]),error:/有效/}
  ];
  for(const c of cases){
   probe=await mini.evaluate(base64=>{const p=wx.env.USER_DATA_PATH+'/local_parser_test.pdf';wx.getFileSystemManager().writeFileSync(p,base64,'base64');return p},Buffer.from(c.bytes).toString('base64'));
   await reader.setData({file:{name:'本机验证.pdf',path:probe,size:'0.02'}});console.log('正在检查：'+c.name);await reader.callMethod('run');const data=await reader.data();
   if(c.error)assert.match(data.error,c.error);else{assert.equal(data.error,'',data.parseDetail);assert.ok(data.report);assert.ok(data.pageCount>=1);}
   console.log('通过：'+c.name);
   if(c.name==='新增栏目'&&process.env.WECHAT_SKIP_SCREENSHOTS!=='1')await mini.screenshot({path:path.resolve(__dirname,'../artifacts/pdf-local.png')});
  }
 }finally{
  try{
  if(probe)await mini.evaluate(p=>{try{wx.getFileSystemManager().unlinkSync(p)}catch(e){}},probe);
  await mini.reLaunch('/pages/index/index');}finally{await mini.disconnect();}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
