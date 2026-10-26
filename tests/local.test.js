const {test,beforeEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const store=require('../miniprogram/utils/data'),{resumeText}=require('../miniprogram/utils/resume-text'),{detailed}=require('./fixtures');
const {extractPdf,MAX_BYTES}=require('../miniprogram/packages/pdf-reader/extract'),{fontDocument}=require('./pdf-fixtures');
let memory;
function noNetwork(){throw Error('本机功能不应使用网络或数据库');}
beforeEach(()=>{memory={};global.wx={getStorageSync:k=>memory[k]&&JSON.parse(JSON.stringify(memory[k])),setStorageSync:(k,v)=>memory[k]=JSON.parse(JSON.stringify(v)),cloud:new Proxy({},{get:noNetwork}),request:noNetwork,uploadFile:noNetwork,login:noNetwork,pageScrollTo(){},showModal(){},showToast(){}};});
function pageFor(file){let def;vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/'+file),'utf8'),{Page:value=>def=value,wx:global.wx,require:p=>require(path.resolve(__dirname,'../miniprogram',path.dirname(file),p))});return {...def,data:JSON.parse(JSON.stringify(def.data)),setData(value){Object.assign(this.data,value);},getTabBar:()=>({setData(){}})};}
test('startup and profile never initialize services or require login',()=>{
 let app;vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/app'),'utf8'),{App:value=>app=value,wx:global.wx});
 assert.equal(app.globalData.storageMode,'local');const r=store.create('classic',true);store.toggleFavorite('classic');
 const page=pageFor('pages/profile/profile.js');page.onShow();assert.equal(page.data.count,1);assert.equal(page.data.favoriteCount,1);assert.ok(store.get(r.id));
 for(const key of ['login','backup','restore','deleteCloud'])assert.equal(page[key],undefined);
});
test('saved resume diagnosis uses meaningful visible text and no request',()=>{
 const r=store.create();r.content=detailed();r.content.hiddenSections=['certificates','custom_custom1'];store.save(r);
 const text=resumeText(r);assert.ok(text.includes('浙江工商大学'));assert.ok(!text.includes('数据分析职业证书'));assert.ok(!text.includes('志愿服务'));
 const page=pageFor('pages/optimize/optimize.js');page.onShow();page.run();assert.ok(page.data.report);assert.equal(page.data.error,'');
});
test('deleting a selected resume before diagnosis gives a useful local error',()=>{
 const r=store.create();const page=pageFor('pages/optimize/optimize.js');page.onShow();store.remove(r.id);page.run();assert.match(page.data.error,/创建一份简历/);
});
test('local parser reads compressed Chinese using packaged character maps without fetch',async()=>{
 const original=global.fetch;global.fetch=noNetwork;
 try{const fixture=fontDocument(),result=await extractPdf(fixture.bytes);assert.equal(result.pageCount,1);assert.ok(result.text.includes(fixture.text));}
 finally{global.fetch=original;}
});
test('local parser reads exported PDF including optional Chinese sections',async()=>{
 const pdf=require('../miniprogram/utils/pdf'),r={content:detailed()},t=store.templates[0];
 const result=await extractPdf(new Uint8Array(Buffer.from(pdf.buildResume(r,t),'ascii')));assert.ok(result.text.includes('数据分析职业证书'));assert.ok(result.text.includes('志愿服务'));
});
test('scanned, encrypted, oversized and invalid documents have clear errors',async()=>{
 await assert.rejects(extractPdf(fontDocument({blank:true}).bytes),/扫描件/);
 await assert.rejects(extractPdf(fontDocument({encrypted:true}).bytes),/加密/);
 await assert.rejects(extractPdf(fontDocument({pageCount:16}).bytes),/十五页/);
 await assert.rejects(extractPdf(new Uint8Array(MAX_BYTES+1)),/八兆/);
 await assert.rejects(extractPdf(new Uint8Array([1,2,3])),/有效/);
});
test('runtime application contains no database, upload or login calls',()=>{
 const root=path.resolve(__dirname,'../miniprogram');
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.js'))assert.ok(!/wx\s*\.\s*(cloud|request|uploadFile|login)\b/.test(fs.readFileSync(p,'utf8')),p);}}
 walk(root);assert.ok(!Object.hasOwn(JSON.parse(fs.readFileSync(path.resolve(__dirname,'../project.config.json'),'utf8')),'cloudfunctionRoot'));
});
test('parser works without browser streams, native structuredClone or abort APIs', {timeout:5000},async()=>{
 const context={module:{exports:{}},exports:{},console,setTimeout,clearTimeout,URL,TextDecoder,TextEncoder,atob,btoa};vm.createContext(context);
 vm.runInContext('delete Array.prototype.at;delete String.prototype.at;delete Object.getPrototypeOf(Uint8Array.prototype).at;',context);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/packages/pdf-reader/vendor/parser.js'),'utf8'),context);
 const maps=require('../miniprogram/vendor/pdf-cmaps');class C{fetch({name}){return Promise.resolve({cMapData:Uint8Array.from(atob(maps[name]),v=>v.charCodeAt(0)),isCompressed:true});}}
 const task=context.module.exports.getDocument({data:fontDocument().bytes,CMapReaderFactory:C,useWorkerFetch:false,disableFontFace:true,isEvalSupported:false,verbosity:0});
 try{const doc=await task.promise,content=await(await doc.getPage(1)).getTextContent();assert.ok(content.items.some(row=>row.str.includes('浙江工商大学')));}
 finally{await task.destroy();}
});
test('local PDF parsing can be cancelled before or during work',async()=>{
 const first=new AbortController();first.abort();await assert.rejects(extractPdf(fontDocument().bytes,()=>{},{signal:first.signal}),/取消/);
 const second=new AbortController(),task=extractPdf(fontDocument().bytes,()=>{},{signal:second.signal});second.abort();await assert.rejects(task,/取消/);
});
test('parser isolates read-only browser globals and works without a URL constructor', {timeout:5000},async()=>{
 const context={module:{exports:{}},exports:{},console,setTimeout,clearTimeout,TextDecoder,TextEncoder,atob,btoa};vm.createContext(context);
 vm.runInContext("Object.defineProperty(globalThis,'document',{get(){return null;}});Object.defineProperty(globalThis,'pdfjsWorker',{get(){return null;}});globalThis.URL=undefined;",context);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/packages/pdf-reader/vendor/parser.js'),'utf8'),context);
 const maps=require('../miniprogram/vendor/pdf-cmaps');class C{fetch({name}){return Promise.resolve({cMapData:Uint8Array.from(atob(maps[name]),v=>v.charCodeAt(0)),isCompressed:true});}}
 const task=context.module.exports.getDocument({data:fontDocument().bytes,CMapReaderFactory:C,useWorkerFetch:false,disableFontFace:true,isEvalSupported:false,verbosity:0});
 try{const doc=await task.promise,content=await(await doc.getPage(1)).getTextContent();assert.ok(content.items.some(row=>row.str.includes('浙江工商大学')));assert.equal(vm.runInContext('globalThis.pdfjsWorker',context),null);assert.equal(vm.runInContext('globalThis.URL',context),undefined);}finally{await task.destroy();}
});
