const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const files=require('../miniprogram/utils/file-delivery');
const filePath='wxfile://usr/林知夏_简历.pdf';
function platform(value){global.wx={getDeviceInfo:()=>({platform:value})};}
test('desktop saves the PDF to disk while mobile sends the actual PDF file',async()=>{
 for(const device of ['windows','mac','ios','android','ohos','devtools']){
  platform(device);const calls=[];
  wx.saveFileToDisk=o=>{calls.push('disk');assert.equal(o.filePath,filePath);o.success();};
  wx.shareFileMessage=o=>{calls.push('chat');assert.equal(o.filePath,filePath);assert.equal(o.fileName,'林知夏_简历.pdf');o.success();};
  const result=await files.deliver(filePath),destination=['windows','mac'].includes(device)?'disk':'chat';
  assert.deepEqual(calls,[destination]);assert.deepEqual(result,{destination,cancelled:false});
 }
});
test('cancelled save or send never reports success or switches to preview',async()=>{
 for(const device of ['mac','ios']){
  platform(device);const api=device==='mac'?'saveFileToDisk':'shareFileMessage';
  wx[api]=o=>o.fail({errMsg:api+':fail cancel'});
  assert.equal((await files.deliver(filePath)).cancelled,true);
 }
});
test('unsupported clients and file delivery failures return useful Chinese errors',async()=>{
 platform('ios');await assert.rejects(files.deliver(filePath),/更新微信/);
 wx.shareFileMessage=o=>o.fail({errMsg:'shareFileMessage:fail network error'});
 await assert.rejects(files.deliver(filePath),/检查网络/);
 platform('windows');wx.saveFileToDisk=o=>o.fail({errMsg:'saveFileToDisk:fail permission denied'});
 await assert.rejects(files.deliver(filePath),/未允许/);
});
test('older clients detect desktop through the compatible device API',()=>{
 global.wx={getSystemInfoSync:()=>({platform:'windows'})};assert.equal(files.target(),'disk');
 global.wx={getDeviceInfo:()=>{throw Error('unavailable');}};assert.equal(files.target(),'chat');
});
function previewPage(device,delivery,generate){
 platform(device);const calls=[];
 Object.assign(wx,{showLoading(){},hideLoading(){},showToast:o=>calls.push(o.title),showModal:o=>calls.push(o.title),openDocument:async o=>{calls.push('preview');assert.equal(o.fileType,'pdf');}});
 wx[device==='windows'?'saveFileToDisk':'shareFileMessage']=delivery||((o)=>{calls.push('save');o.success();});
 let definition,generated=0;
 vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/pages/preview/preview.js'),'utf8'),{
  require:p=>p==='../../utils/pdf'?{pageCount:()=>1,exportResume:async()=>{generated++;return generate?generate():filePath;}}:require(path.resolve(__dirname,'../miniprogram/pages/preview',p)),
  Page:value=>definition=value,wx:global.wx
 });
 const page={...definition,data:{...definition.data,resume:{content:{}},isSample:false,template:{free:true},exportWarnings:[{title:'建议补充联系方式'}]},setData(value){Object.assign(this.data,value);}};
 return {page,calls,generated:()=>generated};
}
test('download immediately saves a PDF without opening a viewer or confirming optional suggestions',async()=>{
 const {page,calls,generated}=previewPage('windows');
 await page.prepareFile();
 await page.export();assert.equal(generated(),1);assert.deepEqual(calls,['save']);
 assert.equal(page.data.exportedFile,filePath);assert.equal(page.data.busy,false);assert.match(page.data.fileStatus,/已保存/);
 await page.viewFile();assert.deepEqual(calls,['save','preview']);
});
test('mobile cancellation retains the generated file and retry does not regenerate it',async()=>{
 let cancelled=true;
 const {page,generated}=previewPage('ios',o=>cancelled?o.fail({errMsg:'shareFileMessage:fail cancel'}):o.success());
 await page.prepareFile();
 await page.export();assert.match(page.data.fileStatus,/已取消/);assert.equal(page.data.exportedFile,filePath);
 cancelled=false;await page.saveFile();assert.equal(generated(),1);assert.match(page.data.fileStatus,/已发送/);
});
test('busy or invalid resumes cannot start another download',async()=>{
 const {page,generated}=previewPage('windows');page.data.busy=true;await page.export();assert.equal(generated(),0);
 page.data.busy=false;page.data.exportErrors=[{title:'请填写姓名'}];await page.export();assert.equal(generated(),0);assert.equal(page.data.busy,false);
});
test('save and send APIs run in the same synchronous user tap after file preparation',async()=>{
 for(const device of ['windows','ios']){
  let gesture=false,invoked=false;
  const {page,generated}=previewPage(device,o=>{assert.equal(gesture,true,'文件接口必须在点击调用栈内触发');invoked=true;o.success();});
  await page.prepareFile();assert.equal(generated(),1);
  gesture=true;const result=page.export();gesture=false;
  assert.equal(invoked,true,'在任何微任务之前调用文件接口');await result;
  assert.equal(generated(),1,'点击时不再异步生成文件');
 }
});
test('unprepared download never automatically sends when asynchronous generation finishes',async()=>{
 const {page,calls}=previewPage('ios');
 page.export();await page.preparingPromise;
 assert.ok(page.data.preparedFile);assert.deepEqual(calls,[]);
 await page.export();assert.deepEqual(calls,['save']);
});
test('unused prepared files are cleaned when leaving',async()=>{
 const {page}=previewPage('ios');
 await page.prepareFile();let deleted='';wx.getFileSystemManager=()=>({unlinkSync:p=>deleted=p});
 page.onUnload();assert.equal(deleted,filePath);
});
test('preview prepares a valid resume before the download tap',async()=>{
 const {page,generated}=previewPage('ios');page.data.previewContent=require('./fixtures').detailed();
 page.updateMeta();await page.preparingPromise;
 assert.equal(generated(),1);assert.equal(page.data.preparedFile,filePath);assert.equal(page.data.preparing,false);
});
test('failed preparation exposes retry and succeeds without sending automatically',async()=>{
 let fail=true;const {page,calls}=previewPage('ios',undefined,()=>{if(fail)throw Error('文件写入失败，请检查设备剩余空间。');return filePath;});
 await page.prepareFile();assert.match(page.data.prepareError,/文件写入失败/);assert.equal(page.data.preparing,false);
 fail=false;await page.prepareFile();assert.equal(page.data.prepareError,'');assert.equal(page.data.preparedFile,filePath);assert.deepEqual(calls,[]);
});
test('ad unlocking does not send outside a user tap and requests another click',async()=>{
 const {page,calls}=previewPage('ios');await page.prepareFile();
 wx.getStorageSync=()=>[];page.data.template={id:'locked-template',free:false};page.ensureUnlocked=async()=>true;
 await page.export();assert.ok(calls.some(value=>value.includes('请点击下载')));assert.ok(!calls.includes('save'));
});
test('gesture and unsupported failures preserve original details instead of claiming network failure',async()=>{
 platform('ios');wx.shareFileMessage=o=>o.fail({errMsg:'shareFileMessage:fail can only be invoked by user TAP gesture.'});
 await assert.rejects(files.deliver(filePath),e=>/直接点击/.test(e.message)&&/user TAP/.test(e.detail)&&!e.message.includes('网络'));
 platform('devtools');wx.shareFileMessage=o=>o.fail({errMsg:'shareFileMessage:fail not supported'});
 await assert.rejects(files.deliver(filePath),/开发者工具不支持/);
});
test('preparation discards an obsolete in-flight export and builds the current template',async()=>{
 let release,count=0;const deleted=[];
 const {page,calls}=previewPage('ios',undefined,()=>++count===1?new Promise(resolve=>release=resolve):'wxfile://usr/新版.pdf');
 wx.getFileSystemManager=()=>({unlinkSync:p=>deleted.push(p)});
 const first=page.prepareFile();page.data.template={id:'new',free:true};const second=page.prepareFile();release('wxfile://usr/旧版.pdf');
 await first;await second;assert.equal(page.data.preparedFile,'wxfile://usr/新版.pdf');assert.ok(deleted.includes('wxfile://usr/旧版.pdf'));assert.deepEqual(calls,[]);
});
test('missing export is regenerated and only a new tap may send it',async()=>{
 let available=true;const {page,generated,calls}=previewPage('ios',undefined,()=>{available=true;return filePath;});await page.prepareFile();available=false;
 wx.getFileSystemManager=()=>({accessSync:()=>{if(!available)throw Error('ENOENT');},unlinkSync(){}});
 await page.export();if(page.preparingPromise)await page.preparingPromise;assert.equal(generated(),2);assert.ok(!calls.includes('save'));
 await page.export();assert.ok(calls.includes('save'));assert.equal(page.data.deliveryDetail,'');
});
test('leaving during preparation cleans the file and never sends from the disposed page',async()=>{
 let release;const deleted=[];const {page,calls}=previewPage('ios',undefined,()=>new Promise(resolve=>release=resolve));wx.getFileSystemManager=()=>({unlinkSync:p=>deleted.push(p)});
 const pending=page.prepareFile();page.onUnload();release(filePath);await pending;await page.export();assert.deepEqual(deleted,[filePath]);assert.ok(!calls.includes('save'));
});
test('returning from a file dialog after leaving never updates the disposed preview',async()=>{
 let finish;const {page}=previewPage('ios',o=>finish=o.success);await page.prepareFile();
 const pending=page.export();page.onUnload();page.setData=()=>{throw Error('disposed page');};finish();await pending;
});
