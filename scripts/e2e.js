const automator=require('miniprogram-automator');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {templates}=require('../miniprogram/utils/catalog');
const routeEvent=value=>({currentTarget:{dataset:{value}}});
const inputEvent=(key,value)=>({currentTarget:{dataset:{path:key}},detail:{value}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function bounded(promise,label){
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+'超时')),20000);})]);}
 finally{clearTimeout(timer);}
}
(async()=>{
 const mini=await bounded(automator.connect({wsEndpoint:process.env.WECHAT_WS||'ws://127.0.0.1:9420'}),'连接模拟器');
 const createdIDs=[],addedFavorites=[],errors=[];
 mini.on('exception',error=>errors.push(error));
 const dir=path.resolve(__dirname,'../artifacts');fs.mkdirSync(dir,{recursive:true});
 const shot=async(name,page)=>{if(process.env.WECHAT_SKIP_SCREENSHOTS==='1')return;await page.waitFor(350);await bounded(mini.screenshot({path:path.join(dir,name+'.png')}),'页面截图');};
 try{
  let page=await bounded(mini.reLaunch('/pages/index/index'),'加载首页');
  await page.waitFor(500);
  assert.equal((await page.data()).templateCount,320);
  assert.ok(await page.$('.hero-button'));
  await shot('home',page);console.log('通过：首页中文界面与模板数量');

  await (await page.$('.hero-button')).tap();await pause(800);page=await mini.currentPage();
  assert.equal(page.path,'pages/editor/editor');const id=(await page.data()).resume.id;createdIDs.push(id);
  await (await page.$('[data-path="resume.content.name"]')).input('流程测试用户');
  await (await page.$('[data-path="resume.content.role"]')).input('产品经理');
  await page.callMethod('add',{currentTarget:{dataset:{key:'education'}}});
  await page.callMethod('add',{currentTarget:{dataset:{key:'education'}}});
  await page.callMethod('input',inputEvent('resume.content.education[0].school','第一段教育经历'));
  await page.callMethod('input',inputEvent('resume.content.education[1].school','第二段教育经历'));
  await page.callMethod('move',{currentTarget:{dataset:{key:'education',index:1,offset:-1}}});
  assert.equal((await page.data()).resume.content.education[0].school,'第二段教育经历');
  await page.callMethod('save');await shot('editor',page);
  await page.callMethod('tab',{currentTarget:{dataset:{index:1}}});
  await page.callMethod('add',{currentTarget:{dataset:{key:'internships'}}});
  await page.callMethod('input',inputEvent('resume.content.internships[0].company','测试实习单位'));
  await page.callMethod('tab',{currentTarget:{dataset:{index:2}}});
  await page.callMethod('add',{currentTarget:{dataset:{key:'certificates'}}});
  await page.waitFor(150);
  await (await page.$('[data-path="resume.content.certificates[0].name"]')).input('测试资格证书');
  await page.callMethod('add',{currentTarget:{dataset:{key:'languages'}}});
  await page.callMethod('input',inputEvent('resume.content.languages[0].name','英语'));
  await page.callMethod('input',inputEvent('resume.content.languages[0].level','大学英语六级'));
  await page.callMethod('add',{currentTarget:{dataset:{key:'customSections'}}});
  await page.callMethod('input',inputEvent('resume.content.customSections[0].title','实践成果'));
  await page.callMethod('input',inputEvent('resume.content.customSections[0].detail','完成一项独立调研，输出调研报告。'));
  await page.callMethod('save');
  await mini.callWxMethod('pageScrollTo',{selector:'#section-certificates',duration:0});await shot('editor-extras',page);
  await page.callMethod('checkpoint');const version=(await page.data()).versions[0];
  await page.callMethod('input',inputEvent('resume.content.name','修改后的测试姓名'));await page.callMethod('save');
  await mini.mockWxMethod('showModal',{confirm:true,cancel:false});
  await page.callMethod('restore',{currentTarget:{dataset:{id:version.id}}});await page.waitFor(250);await mini.restoreWxMethod('showModal');
  assert.equal((await page.data()).resume.content.name,'流程测试用户');assert.ok((await page.data()).versions.length>=2);
  await page.callMethod('tab',{currentTarget:{dataset:{index:3}}});
  await page.callMethod('preference',{currentTarget:{dataset:{key:'fontSize',value:'small'}}});
  await page.callMethod('preference',{currentTarget:{dataset:{key:'spacing',value:'compact'}}});
  await page.callMethod('visibleSection',{currentTarget:{dataset:{key:'certificates'}},detail:{value:false}});
  let customIndex=(await page.data()).orderRows.findIndex(row=>row.title==='实践成果');
  while(customIndex>0){await page.callMethod('moveSection',{currentTarget:{dataset:{index:customIndex,offset:-1}}});customIndex--;}
  assert.equal((await page.data()).orderRows[0].title,'实践成果');
  await mini.callWxMethod('pageScrollTo',{selector:'.typography-card',duration:0});await shot('editor-layout',page);
  await mini.callWxMethod('pageScrollTo',{selector:'.version-card',duration:0});await shot('editor-versions',page);
  console.log('通过：实习、证书、语言、自定义栏目、显隐、顺序、排版与版本恢复');

  await page.callMethod('preview');await pause(800);page=await mini.currentPage();
  assert.equal(page.path,'pages/preview/preview');assert.equal((await page.data()).resume.content.name,'流程测试用户');
  assert.ok((await page.data()).pageCount>=1);await shot('resume-preview',page);console.log('通过：编辑、经历排序、保存与带页数的预览');

  await (await page.$('.change-link')).tap();await pause(800);page=await mini.currentPage();await page.waitFor(300);
  assert.equal(page.path,'pages/templates/templates');assert.equal((await page.data()).target.id,id);
  assert.equal((await page.data()).total,320);assert.equal((await page.data()).list.length,18);
  const beforeFavorites=await mini.evaluate(()=>wx.getStorageSync('favorite_templates_v1')||[]);
  const chosen=templates.find(t=>t.free&&!beforeFavorites.includes(t.id))||templates[0];
  if(!beforeFavorites.includes(chosen.id)){
   await page.callMethod('favorite',{currentTarget:{dataset:{id:chosen.id}}});
   addedFavorites.push(chosen.id);
  }
  await page.callMethod('preview',{currentTarget:{dataset:{id:'sidebar'}}});await pause(800);page=await mini.currentPage();
  assert.equal((await page.data()).previewContent.name,'流程测试用户');
  await page.callMethod('variant',{currentTarget:{dataset:{id:'sidebar-navy'}}});
  assert.equal((await page.data()).template.id,'sidebar-navy');
  await page.callMethod('use');await pause(800);page=await mini.currentPage();
  assert.equal(page.path,'pages/editor/editor');
  const changed=(await page.data()).resume;assert.equal(changed.id,id);assert.equal(changed.templateId,'sidebar-navy');
  assert.equal(changed.content.name,'流程测试用户');assert.equal(changed.content.education[0].school,'第二段教育经历');
  assert.equal(changed.content.certificates[0].name,'测试资格证书');assert.ok(changed.content.hiddenSections.includes('certificates'));assert.equal(changed.content.preferences.fontSize,'small');console.log('通过：收藏、配色切换及保留全部栏目与排版的模板更换');

  page=await mini.switchTab('/pages/templates/templates');await page.waitFor(300);await page.callMethod('reset');
  assert.equal((await page.data()).target,null);
  await page.callMethod('filter',routeEvent('技术岗'));assert.equal((await page.data()).total,30);
  await page.callMethod('reset');await page.callMethod('access',routeEvent('免费'));assert.equal((await page.data()).total,189);
  await page.callMethod('reset');await page.callMethod('group',{detail:{value:3}});assert.equal((await page.data()).total,50);
  await page.callMethod('search',{detail:{value:'靛蓝'}});assert.equal((await page.data()).total,5);
  await page.callMethod('reset');await page.callMethod('loadMore');assert.equal((await page.data()).list.length,36);
  while((await page.data()).hasMore)await page.callMethod('loadMore');
  assert.equal((await page.data()).list.length,320);
  await page.callMethod('reset');await shot('templates',page);
  await page.callMethod('access',routeEvent('新增'));assert.equal((await page.data()).total,200);await shot('templates-new',page);await page.callMethod('reset');
  await page.callMethod('access',routeEvent('收藏'));assert.ok((await page.data()).list.some(t=>t.id===chosen.id));
  await shot('favorites',page);await page.callMethod('reset');
  console.log('通过：岗位、免费、版式、搜索、收藏及分批加载全部模板');

  page=await mini.navigateTo('/pages/optimize/optimize');
  await page.setData({mode:'text',text:'某科技有限公司，负责产品运营与用户增长，2024年至今。主导新用户成长计划，通过流程优化提升激活率23%，覆盖10000人。浙江工商大学，市场营销本科。专业技能包括数据分析、表格处理和用户研究。联系电话13800002026。'});
  await page.callMethod('run');await page.waitFor(400);assert.ok((await page.data()).report);
  await shot('diagnosis',page);console.log('通过：真实文字检查与修改建议');

  page=await mini.switchTab('/pages/profile/profile');await page.waitFor(300);
  assert.equal((await page.data()).templateCount,320);await shot('profile',page);
  await page.callMethod('favorites');await pause(700);page=await mini.currentPage();
  assert.equal((await page.data()).access,'收藏');
  assert.ok((await page.data()).list.some(t=>t.id===chosen.id));
  console.log('通过：个人中心数量与收藏入口');

  page=await mini.switchTab('/pages/resumes/resumes');await page.waitFor(300);
  await page.callMethod('sort',{detail:{value:1}});await shot('resumes',page);
  assert.equal(errors.length,0,JSON.stringify(errors));console.log('通过：简历排序；未发现运行时异常');
 }finally{
  try{
  await mini.restoreWxMethod('showModal');
  await mini.evaluate(payload=>{
   const ids=payload.ids,favorites=payload.favorites;
   const rows=wx.getStorageSync('resumes_v1')||[];wx.setStorageSync('resumes_v1',rows.filter(r=>!ids.includes(r.id)));
   const versions=wx.getStorageSync('resume_versions_v1')||{};for(const id of ids)delete versions[id];wx.setStorageSync('resume_versions_v1',versions);const current=wx.getStorageSync('favorite_templates_v1')||[];wx.setStorageSync('favorite_templates_v1',current.filter(id=>!favorites.includes(id)));
   wx.removeStorageSync('template_target_v1');wx.removeStorageSync('template_access_v1');
  },{ids:createdIDs,favorites:addedFavorites});
  await mini.switchTab('/pages/index/index');}finally{await mini.disconnect();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});


