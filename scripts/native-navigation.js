const automator=require('miniprogram-automator'),assert=require('node:assert/strict');
(async()=>{
 const mini=await automator.connect({wsEndpoint:process.env.WECHAT_WS||'ws://127.0.0.1:9442'});let id;
 try{
  await mini.reLaunch('/pages/index/index');console.log('已加载首页');
  id=await mini.evaluate(()=>{const store=require('utils/data.js'),r=store.create('classic',true);r.content.name='往返检查用户';store.save(r);return r.id;});
  let page=await mini.navigateTo('/pages/editor/editor?id='+id);console.log('已进入待验证编辑页');
  await page.callMethod('preview');await page.waitFor(1000);page=await mini.currentPage();assert.equal(page.path,'pages/preview/preview');console.log('已进入预览，准备点击返回');
  await(await page.$('.fixed-actions .outline')).tap();await page.waitFor(1000);page=await mini.currentPage();
  assert.equal(page.path,'pages/editor/editor');assert.equal((await page.data()).resume.id,id);assert.equal((await page.data()).resume.content.name,'往返检查用户');
  assert.equal(await mini.evaluate(()=>getCurrentPages().filter(p=>p.route==='pages/editor/editor').length),1);
  console.log('通过：真实点击返回原编辑页，姓名与草稿保留，编辑页面没有重复堆叠。');
 }finally{
  try{
  // Unload before removing the fixture, so onHide cannot recreate it.
  await mini.reLaunch('/pages/index/index');
  if(id)await mini.evaluate(id=>{const rows=wx.getStorageSync('resumes_v1')||[];wx.setStorageSync('resumes_v1',rows.filter(r=>r.id!==id));const versions=wx.getStorageSync('resume_versions_v1')||{};delete versions[id];wx.setStorageSync('resume_versions_v1',versions);},id);
  }finally{await mini.disconnect();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
