const store=require('../../utils/data');
const {sectionDefs,preferenceOptions}=require('../../utils/editor-fields');
const {sectionRows}=require('../../utils/layout');
const {review}=require('../../utils/review');
Page({
 data:{resume:null,progress:0,saved:'已保存至本机',active:0,tabs:['基本资料','经历项目','补充内容','排版设置'],sections:sectionDefs,templates:store.templates,templateIndex:0,expanded:{education:true,experience:true},orderRows:[],versions:[],preferenceOptions,preferenceGroups:[{key:'fontSize',title:'正文字号'},{key:'spacing',title:'段落间距'},{key:'margin',title:'页面留白'}],restoreBusy:false,versionError:'',loadError:'',keyboardVisible:false},
 onLoad(options={}){
  this.loadOptions=options;
  let resume;try{resume=options.id?store.get(options.id):store.create(options.template||'classic');}catch(e){this.setData({loadError:e.message||'本机简历暂时无法打开'});return;}
  if(!resume){wx.showModal({title:'简历不存在',content:'这份简历可能已被删除。',showCancel:false,success:()=>{if(getCurrentPages().length>1)wx.navigateBack();else wx.switchTab({url:'/pages/resumes/resumes'});}});return;}
  this.setResume(resume);this.refreshVersions();
 },
 retryLoad(){this.onLoad(this.loadOptions||{});},
 onShow(){if(this.data.resume&&!this.dirty){try{const latest=store.get(this.data.resume.id);if(!latest){this.setData({resume:null,loadError:'这份简历已不存在，请返回简历夹。'});}else if(JSON.stringify(latest)!==JSON.stringify(this.data.resume)){this.setResume(latest);this.refreshVersions();}}catch(e){this.setData({loadError:e.message});}}this.activePage=true;this.setData({keyboardVisible:false});if(typeof wx.onKeyboardHeightChange==='function'&&!this.keyboardListener){this.keyboardListener=e=>{if(this.activePage)this.setData({keyboardVisible:e.height>0});};wx.onKeyboardHeightChange(this.keyboardListener);}},
 stopKeyboard(){this.activePage=false;if(this.keyboardListener&&typeof wx.offKeyboardHeightChange==='function')wx.offKeyboardHeightChange(this.keyboardListener);this.keyboardListener=null;},
 draftAlert(enabled){try{if(enabled&&typeof wx.enableAlertBeforeUnload==='function')wx.enableAlertBeforeUnload({message:'部分修改尚未保存，请留在页面检查设备空间。'});else if(!enabled&&typeof wx.disableAlertBeforeUnload==='function')wx.disableAlertBeforeUnload();}catch(e){}},
 setResume(resume){const index=Math.max(0,store.templates.findIndex(t=>t.id===resume.templateId));this.setData({resume,loadError:'',templateIndex:index,progress:store.completion(resume.content),orderRows:sectionRows(resume.content,store.templates[index])});},
 input(e){
  const path=e.currentTarget.dataset.path;
  if(typeof path!=='string'||!/^resume\.(?:title$|content(?:$|\.|\[))/.test(path))return;
  const value=path==='resume.content'?store.normalize({...this.data.resume,content:e.detail.value}).content:e.detail.value;
  this.setData({[path]:value,saved:'正在保存…'});this.dirty=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.save(),600);
 },
 save(){
  if(!this.data.resume||!this.dirty)return true;
  try{const resume=store.save(this.data.resume);this.dirty=false;this.draftAlert(false);this.setData({'resume.updatedAt':resume.updatedAt,progress:store.completion(resume.content),orderRows:sectionRows(resume.content,store.templates[this.data.templateIndex]),saved:'已保存至本机'});return true;}
  catch(e){this.draftAlert(true);this.setData({saved:e.message||'保存失败，请检查设备空间后重试'});return false;}
 },
 onHide(){this.stopKeyboard();clearTimeout(this.timer);this.save();},onUnload(){this.stopKeyboard();clearTimeout(this.timer);this.save();this.draftAlert(false);},
 tab(e){if(!this.save())return;this.setData({active:Number(e.currentTarget.dataset.index)});if(this.data.active===3)this.refreshVersions();},
 toggleSection(e){const key=e.currentTarget.dataset.key;this.setData({['expanded.'+key]:!this.data.expanded[key]});},
 templateGallery(){if(!this.save())return;try{wx.setStorageSync('template_target_v1',this.data.resume.id);wx.switchTab({url:'/pages/templates/templates'});}catch(e){wx.showToast({title:'暂时无法打开模板馆，请检查本机空间',icon:'none'});}},
 template(e){const i=Number(e.detail.value);if(!store.templates[i]||!this.save())return;try{this.setResume(store.changeTemplate(this.data.resume.id,store.templates[i].id));this.refreshVersions();}catch(e){wx.showToast({title:e.message||'更换失败，请重试',icon:'none'});}},
 move(e){const {key}=e.currentTarget.dataset,index=Number(e.currentTarget.dataset.index),offset=Number(e.currentTarget.dataset.offset),entries=this.data.resume.content[key].slice(),next=index+offset;if(next<0||next>=entries.length)return;[entries[index],entries[next]]=[entries[next],entries[index]];this.setData({['resume.content.'+key]:entries});this.dirty=true;this.save();},
 add(e){
  const key=e.currentTarget.dataset.key,definition=sectionDefs.find(s=>s.key===key);if(!definition)return;
  if(this.data.resume.content[key].length>=30){wx.showToast({title:'每类最多添加三十条',icon:'none'});return;}
  const entry={id:store.uid()};definition.fields.forEach(f=>entry[f.key]='');
  this.setData({['resume.content.'+key]:this.data.resume.content[key].concat(entry),['expanded.'+key]:true});this.dirty=true;this.save();
 },
 remove(e){const {key,index}=e.currentTarget.dataset;wx.showModal({title:'移除这条内容？',content:'会同时更新本机草稿。重要内容可以先保存一个版本。',confirmText:'移除',success:r=>{if(r.confirm){this.setData({['resume.content.'+key]:this.data.resume.content[key].filter((_,i)=>i!==Number(index))});this.dirty=true;this.save();}}});},
 preference(e){const {key,value}=e.currentTarget.dataset;if(!preferenceOptions[key]||!preferenceOptions[key].some(x=>x.value===value))return;this.setData({['resume.content.preferences.'+key]:value});this.dirty=true;this.save();},
 compact(){this.setData({'resume.content.preferences':{fontSize:'small',spacing:'compact',margin:'narrow'}});this.dirty=true;if(!this.save())return;wx.showToast({title:'已调整，可预览导出页数',icon:'none'});},
 moveSection(e){const index=Number(e.currentTarget.dataset.index),offset=Number(e.currentTarget.dataset.offset),rows=this.data.orderRows.slice(),next=index+offset;if(next<0||next>=rows.length)return;[rows[index],rows[next]]=[rows[next],rows[index]];this.setData({'resume.content.sectionOrder':rows.map(row=>row.key)});this.dirty=true;this.save();},
 visibleSection(e){const key=e.currentTarget.dataset.key,hidden=this.data.resume.content.hiddenSections.filter(x=>x!==key);if(!e.detail.value)hidden.push(key);this.setData({'resume.content.hiddenSections':hidden});this.dirty=true;this.save();},
 resetOrder(){this.setData({'resume.content.sectionOrder':[]});this.dirty=true;this.save();},
 refreshVersions(){if(!this.data.resume)return;try{this.setData({versionError:'',versions:store.versions(this.data.resume.id).map(v=>({id:v.id,label:v.label,date:store.dateTime(v.savedAt),template:(store.templates.find(t=>t.id===v.snapshot.templateId)||{name:'简历版本'}).name}))});}catch(e){this.setData({versionError:e.message||'本机版本暂时无法读取'});}},
 checkpoint(){if(!this.save())return;try{store.checkpoint(this.data.resume.id);this.refreshVersions();wx.showToast({title:'已保存一个本机版本'});}catch(e){wx.showToast({title:e.message||'版本未保存，请检查设备空间',icon:'none'});}},
 restore(e){if(this.data.restoreBusy)return;const id=e.currentTarget.dataset.id;wx.showModal({title:'恢复这个版本？',content:'当前内容会先自动存为一个版本，再恢复所选版本。',confirmText:'恢复版本',success:r=>{if(!r.confirm||!this.save())return;this.setData({restoreBusy:true});try{clearTimeout(this.timer);this.setResume(store.restoreVersion(this.data.resume.id,id));this.refreshVersions();this.setData({saved:'已恢复并保存至本机'});wx.showToast({title:'版本已恢复'});}catch(e){wx.showToast({title:e.message||'恢复失败',icon:'none'});}finally{this.setData({restoreBusy:false});}}});},
 clearHistory(){wx.showModal({title:'清空这份简历的版本记录？',content:'当前简历保留，清空后无法再恢复这些历史版本。',confirmText:'清空记录',success:r=>{if(r.confirm){try{store.clearVersions(this.data.resume.id);this.refreshVersions();}catch(e){wx.showToast({title:'记录未清空，请检查设备空间',icon:'none'});}}}});},
 example(){wx.showModal({title:'填入示例内容？',content:'当前内容会先存为本机版本，再填入示例。投递前请改成你的真实信息。',confirmText:'填入示例',success:r=>{if(r.confirm){if(!this.save())return;try{store.checkpoint(this.data.resume.id,'填入示例前');this.setData({'resume.content':store.normalize({...this.data.resume,content:store.sample}).content});this.dirty=true;this.save();this.refreshVersions();}catch(e){wx.showToast({title:'请先检查本机存储空间',icon:'none'});}}}});},
 preview(){if(!this.save()){wx.showToast({title:'请先保存成功',icon:'none'});return;}const result=review(this.data.resume.content);if(result.errors.length){const first=result.errors[0];this.setData({active:first.tab,...(first.tab?{['expanded.'+first.path]:true}:{})});wx.showToast({title:first.title,icon:'none'});return;}wx.navigateTo({url:'/pages/preview/preview?id='+this.data.resume.id});}
});


