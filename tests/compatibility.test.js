const {test,beforeEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {mount}=require('./page-helper'),store=require('../miniprogram/utils/data'),storage=require('../miniprogram/utils/storage'),pdf=require('../miniprogram/utils/pdf'),{detailed}=require('./fixtures');
let memory,calls;
const put=(key,value)=>{if(storage.jsonBytes(value)>1024*1024)throw Error('single-key limit');memory[key]=JSON.parse(JSON.stringify(value));};
beforeEach(()=>{memory={};calls=[];global.testPages=[];global.wx={getStorageSync:key=>memory[key]&&JSON.parse(JSON.stringify(memory[key])),setStorageSync:put,removeStorageSync:key=>delete memory[key],showToast:o=>calls.push(o.title),showModal:o=>{calls.push(o.title);if(o.success)o.success({confirm:true,content:'新名称'});else return Promise.resolve({confirm:true});},enableAlertBeforeUnload:()=>calls.push('protect'),disableAlertBeforeUnload:()=>calls.push('unprotect'),getDeviceInfo:()=>({platform:'ios'}),pageScrollTo(){},navigateTo:o=>calls.push(o.url),navigateBack:()=>calls.push('back'),redirectTo:o=>calls.push(o.url),switchTab:o=>{calls.push(o.url);if(o.complete)o.complete();}};});
const input=(p,v)=>({currentTarget:{dataset:{path:p}},detail:{value:v}});
test('Chinese input auto-save updates metadata without resetting form or caret',()=>{
 const page=mount('pages/editor/editor.js');page.onLoad({});page.input(input('resume.content.name','王小禾'));page.patches=[];page.save();
 assert.equal(store.get(page.data.resume.id).content.name,'王小禾');assert.ok(page.patches.every(keys=>!keys.includes('resume')&&!keys.includes('resume.content')));page.onUnload();
});
test('failed auto-save keeps pending input, protects leaving and blocks tab changes until retry',()=>{
 const page=mount('pages/editor/editor.js');page.onLoad({});page.input(input('resume.content.name','尚未保存的新姓名'));wx.setStorageSync=()=>{throw Error('full');};
 page.tab({currentTarget:{dataset:{index:2}}});assert.equal(page.data.active,0);assert.equal(page.data.resume.content.name,'尚未保存的新姓名');assert.equal(page.dirty,true);assert.ok(calls.includes('protect'));
 wx.setStorageSync=put;assert.equal(page.save(),true);assert.equal(store.get(page.data.resume.id).content.name,'尚未保存的新姓名');assert.ok(calls.includes('unprotect'));page.onUnload();
});
test('editor keyboard listener hides actions while typing and is removed when leaving',()=>{
 let handler,removed;wx.onKeyboardHeightChange=fn=>handler=fn;wx.offKeyboardHeightChange=fn=>removed=fn;
 const page=mount('pages/editor/editor.js');page.onLoad({});page.onShow();handler({height:300});assert.equal(page.data.keyboardVisible,true);handler({height:0});assert.equal(page.data.keyboardVisible,false);page.onHide();assert.equal(removed,handler);page.onUnload();
});
test('returning from preview reuses the original editor and refreshes stale stored data',()=>{
 const editor=mount('pages/editor/editor.js');editor.onLoad({});const id=editor.data.resume.id;
 const preview=mount('pages/preview/preview.js');preview.data.resume=editor.data.resume;
 global.testPages=[{route:'pages/editor/editor',data:editor.data},{route:'pages/preview/preview',data:preview.data}];preview.edit();assert.deepEqual(calls,['back']);
 const latest=store.get(id);latest.content.name='最新姓名';store.save(latest);editor.onShow();assert.equal(editor.data.resume.content.name,'最新姓名');editor.onUnload();
});
test('storage uses UTF-8 bytes for Chinese history and keeps the newest snapshot',()=>{
 const r=store.create('classic',true);r.content.summary='中'.repeat(60000);
 for(let i=0;i<7;i++){r.content.name='版本'+i;store.save(r);store.checkpoint(r.id);}
 const versions=store.versions(r.id);assert.ok(versions.length<5);assert.equal(versions[0].snapshot.content.name,'版本6');assert.ok(storage.jsonBytes(memory.resume_versions_v1)<=800*1024);
 r.content.summary='中'.repeat(270000);store.save(r);assert.throws(()=>store.checkpoint(r.id),/内容过长/);assert.equal(store.get(r.id).content.summary.length,270000);
});
test('corrupt local cache is surfaced instead of being silently overwritten',()=>{
 memory.resumes_v1='corrupt';assert.throws(()=>store.create(),/格式异常/);assert.equal(memory.resumes_v1,'corrupt');
 for(const file of ['index','profile','resumes']){const page=mount('pages/'+file+'/'+file+'.js');page.onShow();assert.ok(page.data.loadError);}
});
test('deletion rolls the resume back if removing its version records fails',()=>{
 const a=store.create(),b=store.create();store.checkpoint(a.id);store.checkpoint(b.id);
 wx.setStorageSync=(key,value)=>{if(key==='resume_versions_v1')throw Error('full');put(key,value);};
 assert.throws(()=>store.remove(a.id),/保存失败/);assert.ok(store.get(a.id));assert.equal(store.versions(a.id).length,1);assert.ok(store.get(b.id));
 wx.setStorageSync=put;store.remove(a.id);assert.equal(store.get(a.id),undefined);assert.equal(store.versions(a.id).length,0);assert.equal(store.versions(b.id).length,1);
});
test('old resume metadata does not crash sort, filtering or date labels',()=>{
 memory.resumes_v1=[{id:'old',content:detailed(),title:null,updatedAt:'invalid'}];const page=mount('pages/resumes/resumes.js');page.data.sortIndex=2;page.onShow();assert.equal(page.data.loadError,'');assert.equal(page.data.list[0].date,'未记录日期');
});
test('read-only storage does not crash create, rename, duplicate or delete callbacks',()=>{
 const r=store.create(),page=mount('pages/resumes/resumes.js');wx.setStorageSync=()=>{throw Error('full');};
 const editor=mount('pages/editor/editor.js');editor.onLoad({});assert.ok(editor.data.loadError);
 for(const action of [0,1,2]){wx.showActionSheet=o=>o.success({tapIndex:action});assert.doesNotThrow(()=>page.more({currentTarget:{dataset:{id:r.id}}}));}
 assert.ok(store.get(r.id));assert.ok(calls.includes('操作未完成'));
});
test('completed ad remains usable this session if saving entitlement fails, without hanging',async()=>{
 const config=require('../miniprogram/config'),before=config.rewardedAdUnitId;config.rewardedAdUnitId='test-ad';let close;
 wx.createRewardedVideoAd=()=>({onClose:fn=>close=fn,onError(){},show:()=>Promise.resolve(),load:()=>Promise.resolve()});
 const reward=require('../miniprogram/utils/reward');try{const p=reward.unlock('compatibility-test-template');wx.setStorageSync=()=>{throw Error('full');};close({isEnded:true});const grant=await p;assert.equal(grant.persisted,false);assert.equal(reward.unlocked('compatibility-test-template'),true);}finally{config.rewardedAdUnitId=before;}
});
test('active tab and repeated home tap cannot clear template context or create duplicate editors',()=>{
 memory.template_target_v1='target';const bar=mount('custom-tab-bar/index.js','Component');bar.data.selected=1;bar.switchTab({currentTarget:{dataset:{index:1}}});assert.equal(memory.template_target_v1,'target');assert.deepEqual(calls,[]);
 const home=mount('pages/index/index.js');home.start();home.start();assert.equal(calls.filter(v=>v==='/pages/editor/editor').length,1);
});
test('Android and iOS navigation geometry handles capsule and zero status bar safely',()=>{
 for(const device of [{width:320,top:24,left:226},{width:375,top:44,left:281},{width:430,top:59,left:336},{width:375,top:0,left:0}]){
  wx.getWindowInfo=()=>({windowWidth:device.width,statusBarHeight:device.top});wx.getMenuButtonBoundingClientRect=()=>device.left?{left:device.left,top:device.top+4,height:32}:{};
  const header=mount('components/page-head/page-head.js','Component');header.lifetimes.attached.call(header);assert.equal(header.data.top,device.top);assert.equal(header.data.height,44);assert.ok(Number.isFinite(header.data.right));
 }
});
test('export cache keeps active files, bounds old files and never removes an imported source',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'resume-files-'));const source=path.join(dir,'用户原件.pdf');fs.writeFileSync(source,'source');
 wx.env={USER_DATA_PATH:dir};wx.getFileSystemManager=()=>({mkdirSync:(p,r)=>fs.mkdirSync(p,{recursive:r}),accessSync:fs.accessSync,readdirSync:fs.readdirSync,unlinkSync:fs.unlinkSync,writeFile:o=>fs.writeFile(o.filePath,Buffer.from(o.data),e=>e?o.fail(e):o.success())});
 let protectedFile;
 try{for(let i=0;i<25;i++){const file=await pdf.exportResume({content:{...store.sample,name:i?'林知夏':'林/知\\夏\0'.repeat(20)}},store.templates[0]);if(i===0){protectedFile=file;assert.ok(path.basename(file).length<180);assert.ok(!path.basename(file).includes('\0'));}else pdf.releaseFile(file);}
  assert.ok(fs.existsSync(protectedFile));assert.equal(fs.readFileSync(source,'utf8'),'source');assert.ok(fs.readdirSync(path.join(dir,'resume_exports')).length<=20);
 }finally{if(protectedFile)pdf.releaseFile(protectedFile);fs.rmSync(dir,{recursive:true,force:true});}
});
test('storage failure in template and favorite navigation keeps the current page with feedback',()=>{
 const editor=mount('pages/editor/editor.js');editor.onLoad({});const profile=mount('pages/profile/profile.js');wx.setStorageSync=()=>{throw Error('full');};
 assert.doesNotThrow(()=>editor.templateGallery());assert.doesNotThrow(()=>profile.favorites());assert.ok(calls.some(s=>s.includes('本机空间')));assert.ok(!calls.includes('/pages/templates/templates'));editor.onUnload();
});
test('file page preloads once, reports network failure and permits retry',()=>{
 const page=mount('pages/optimize/optimize.js');let attempts=0,options;wx.loadSubpackage=o=>{attempts++;options=o;};
 page.file();page.file();assert.equal(attempts,1);assert.equal(page.data.fileLoading,true);options.fail();assert.equal(page.data.fileLoading,false);assert.match(page.data.error,/网络/);
 page.file();options.success();assert.ok(calls.some(s=>s.startsWith('/packages/pdf-reader/index/index')));page.onUnload();assert.doesNotThrow(()=>options.fail());
});
