const store=require('../../utils/data');
const {templates,families,findTemplate}=require('../../utils/catalog');
Page({
 data:{featured:['classic','sidebar','editorial','campus'].map(findTemplate),recent:null,resumeCount:0,templateCount:templates.length,layoutCount:families.length,loadError:''},
 onShow(){this.opening=false;const bar=this.getTabBar();if(bar)bar.setData({selected:0});try{const rows=store.all().sort((a,b)=>b.updatedAt-a.updatedAt);this.setData({recent:rows[0]?store.decorate(rows[0]):null,resumeCount:rows.length,loadError:''});}catch(e){this.setData({loadError:e.message||'本机资料暂时无法读取'});}},
 start(){if(this.opening)return;this.opening=true;wx.navigateTo({url:'/pages/editor/editor',fail:()=>{this.opening=false;wx.showToast({title:'页面暂时无法打开，请重试',icon:'none'});}});},
 goTemplates(){wx.removeStorageSync('template_target_v1');wx.switchTab({url:'/pages/templates/templates'});},
 goOptimize(){wx.navigateTo({url:'/pages/optimize/optimize'});},
 goResumes(){wx.switchTab({url:'/pages/resumes/resumes'});},
 templateDetail(e){wx.navigateTo({url:'/pages/preview/preview?template='+e.currentTarget.dataset.id});},
 editRecent(){wx.navigateTo({url:'/pages/editor/editor?id='+this.data.recent.id});},
 onShareAppMessage(){return {title:'好简历｜挑模板，写经历，做好求职准备',path:'/pages/index/index'};}
});
