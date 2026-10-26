const {extractPdf,MAX_BYTES,createAbortController}=require('../extract');
const {analyze}=require('../../../utils/analyze');
Page({
 data:{file:null,job:'',busy:false,stage:'',error:'',report:null,pageCount:0},
 onLoad(o){if(o.job){let job=o.job;try{job=decodeURIComponent(job);}catch(e){}this.setData({job:String(job).slice(0,3000)});}},
 input(e){this.setData({job:e.detail.value,report:null});},
 async choose(){
  if(this.data.busy||this.choosing)return;this.choosing=true;
  try{if(typeof wx.chooseMessageFile!=='function')throw Error('当前微信版本不支持文件选择，请更新微信。');const result=await wx.chooseMessageFile({count:1,type:'file',extension:['pdf']}),f=result.tempFiles&&result.tempFiles[0];
   if(!f||!/\.pdf$/i.test(f.name))throw Error('请选择便携文档格式的简历文件。');
   if(f.size>MAX_BYTES)throw Error('文件超过八兆，请压缩后再试。');
   if(this.unloaded)return;
   this.setData({file:{name:f.name,path:f.path,size:(f.size/1024/1024).toFixed(2)},error:'',report:null,pageCount:0});
  }catch(e){if(!this.unloaded&&!/cancel/i.test(e.errMsg||e.message||''))this.setData({error:e.message||(/privacy|scope|auth|permission/i.test(e.errMsg||'')?'微信未允许读取文件，请检查隐私授权后重试。':'文件选择失败，请重试。')});}finally{this.choosing=false;}
 },
 async run(){
  if(this.data.busy||this.unloaded)return;if(!this.data.file){this.setData({error:'请先选择一份本机简历文件。'});return;}
  this.cancelParsing=createAbortController();
  this.setData({busy:true,error:'',parseDetail:'',pageCount:0,report:null,stage:'正在读取本机文件…'});
  try{
   const fs=wx.getFileSystemManager();const bytes=await new Promise((resolve,reject)=>fs.readFile({filePath:this.data.file.path,success:r=>resolve(r.data),fail:()=>reject(Error('文件读取失败，请重新选择。'))}));
   const result=await extractPdf(bytes,(page,total)=>{if(!this.unloaded)this.setData({stage:'正在解析第 '+page+' / '+total+' 页…'});},{signal:this.cancelParsing.signal});
   if(this.unloaded)return;
   this.setData({report:analyze(result.text,this.data.job),pageCount:result.pageCount});wx.pageScrollTo({selector:'#report',duration:200});
  }catch(e){if(!this.unloaded)this.setData({error:e.message||'文件解析失败，请重试。',parseDetail:e.detail||''});}
  finally{if(!this.unloaded)this.setData({busy:false,stage:''});}
 },
 onUnload(){this.unloaded=true;if(this.cancelParsing)this.cancelParsing.abort();},
 copy(){if(this.data.report)wx.setClipboardData({fail:()=>wx.showToast({title:'复制未完成，请检查剪贴板权限',icon:'none'}),data:[this.data.report.summary,...this.data.report.issues.map(x=>x.title+'：'+x.suggestion)].join('\n\n')});}
});
