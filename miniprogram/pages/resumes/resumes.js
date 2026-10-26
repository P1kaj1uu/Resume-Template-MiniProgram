const store=require('../../utils/data');
Page({
 data:{list:[],query:'',sortIndex:0,sorts:['最近更新','完成度优先','按名称排序'],loadError:''},
 onShow(){this.opening=false;const bar=this.getTabBar();if(bar)bar.setData({selected:2});this.refresh();},
 refresh(){try{this.setData({loadError:'',list:store.all().sort((a,b)=>this.data.sortIndex===1?store.completion(b.content)-store.completion(a.content):this.data.sortIndex===2?a.title.localeCompare(b.title,'zh'):b.updatedAt-a.updatedAt).filter(r=>(r.title+r.content.name+r.content.role).toLowerCase().includes(this.data.query.trim().toLowerCase())).map(store.decorate)});}catch(e){this.setData({loadError:e.message||'本机简历暂时无法读取'});}},
 sort(e){this.setData({sortIndex:Number(e.detail.value)});this.refresh();},
 search(e){this.setData({query:e.detail.value});this.refresh();},
 open(url){if(this.opening)return;this.opening=true;wx.navigateTo({url,fail:()=>{this.opening=false;wx.showToast({title:'页面暂时无法打开，请重试',icon:'none'});}});},
 create(){this.open('/pages/editor/editor');},
 edit(e){this.open('/pages/editor/editor?id='+e.currentTarget.dataset.id);},
 preview(e){this.open('/pages/preview/preview?id='+e.currentTarget.dataset.id);},
 failed(e){wx.showModal({title:'操作未完成',content:e.message||'请检查本机存储后重试。',showCancel:false});this.refresh();},
 more(e){
  const id=e.currentTarget.dataset.id;
  wx.showActionSheet({itemList:['重命名','复制一份','删除简历'],success:res=>{
   try{
    const current=store.get(id);if(!current)throw Error('这份简历已被删除，请重新选择。');
    if(res.tapIndex===0)wx.showModal({title:'重命名简历',editable:true,placeholderText:'输入简历名称',content:current.title,success:r=>{
     if(!r.confirm)return;const title=String(r.content||'').trim();if(!title){wx.showToast({title:'简历名称不能为空',icon:'none'});return;}
     try{const latest=store.get(id);if(!latest)throw Error('这份简历已被删除。');store.save({...latest,title:title.slice(0,40)});this.refresh();}catch(e){this.failed(e);}
    }});
    if(res.tapIndex===1){store.duplicate(id);this.refresh();wx.showToast({title:'已创建副本'});}
    if(res.tapIndex===2)wx.showModal({title:'删除这份简历？',content:'这份本机简历和它的历史版本将被删除，请先确认重要内容已导出。',confirmText:'删除',confirmColor:'#a44e3c',success:r=>{if(r.confirm)try{store.remove(id);this.refresh();}catch(e){this.failed(e);}}});
   }catch(e){this.failed(e);}
  }});
 }
});
