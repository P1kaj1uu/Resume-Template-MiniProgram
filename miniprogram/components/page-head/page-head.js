Component({
 properties:{title:{type:String,value:'好简历'},back:{type:Boolean,value:false}},
 data:{top:24,height:44,right:100},
 lifetimes:{attached(){
  const w=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync(),top=Number.isFinite(w.statusBarHeight)?w.statusBarHeight:24;
  let menu={};try{menu=wx.getMenuButtonBoundingClientRect()||{};}catch(e){}
  const height=Number.isFinite(menu.top)&&menu.height?Math.max(44,(menu.top-top)*2+menu.height):44;
  const right=menu.left>0&&w.windowWidth?Math.max(16,w.windowWidth-menu.left+12):16;
  this.setData({top,height,right});
 }},
 methods:{goBack(){if(getCurrentPages().length>1)wx.navigateBack();else wx.switchTab({url:'/pages/index/index'});}}
});
