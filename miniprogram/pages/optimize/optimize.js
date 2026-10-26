const store=require('../../utils/data');
const {analyze}=require('../../utils/analyze');
const {resumeText}=require('../../utils/resume-text');
Page({
 data:{mode:'local',resumes:[],resumeIndex:0,selectedId:'',text:'',job:'',busy:false,fileLoading:false,error:'',report:null,loadError:''},
 onShow(){try{const resumes=store.all().sort((a,b)=>b.updatedAt-a.updatedAt).map(r=>({id:r.id,title:r.title,name:r.content.name||'未填写姓名',role:r.content.role||'未填写职位'}));const index=Math.max(0,resumes.findIndex(r=>r.id===this.data.selectedId));this.setData({resumes,resumeIndex:index,selectedId:resumes[index]?resumes[index].id:'',loadError:'',report:null});}catch(e){this.setData({loadError:e.message||'本机简历暂时无法读取'});}},
 mode(e){const mode=e.currentTarget.dataset.mode;if(!['local','text'].includes(mode))return;this.setData({mode,error:'',report:null});},
 input(e){const key=e.currentTarget.dataset.key;if(['text','job'].includes(key))this.setData({[key]:e.detail.value,report:null});},
 select(e){const index=Number(e.detail.value),row=this.data.resumes[index];if(row)this.setData({resumeIndex:index,selectedId:row.id,error:'',report:null});},
 run(){if(this.data.busy)return;this.setData({error:'',report:null});try{let text=this.data.text;if(this.data.mode==='local'){const r=store.get(this.data.selectedId);if(!r)throw new Error('请先创建一份简历，或切换到粘贴文字检查。');text=resumeText(r);}const report=analyze(text,this.data.job);this.setData({report});wx.pageScrollTo({selector:'#report',duration:200});}catch(e){this.setData({error:e.message||'检查未完成，请补充内容后重试。'});}},
 file(){
  if(this.data.fileLoading||this.unloaded)return;this.setData({fileLoading:true,error:''});
  const fail=()=>{if(!this.unloaded)this.setData({fileLoading:false,error:'文件检查组件暂时无法加载，请检查网络后重试。'});};
  const open=()=>{if(this.unloaded)return;wx.navigateTo({url:'/packages/pdf-reader/index/index?job='+encodeURIComponent(this.data.job),fail,complete:()=>{if(!this.unloaded)this.setData({fileLoading:false});}});};
  try{if(typeof wx.loadSubpackage==='function')wx.loadSubpackage({name:'pdf-reader',success:open,fail});else open();}catch(e){fail();}
 },
 onUnload(){this.unloaded=true;},
 create(){wx.navigateTo({url:'/pages/editor/editor'});},
 copy(){const r=this.data.report;if(!r)return;wx.setClipboardData({fail:()=>wx.showToast({title:'复制未完成，请检查剪贴板权限',icon:'none'}),data:[r.summary,...r.issues.map((x,i)=>(i+1)+'. '+x.title+'：'+x.suggestion),r.note||''].join('\n\n')});},
 legal(){wx.navigateTo({url:'/pages/legal/legal?type=privacy'});}
});

