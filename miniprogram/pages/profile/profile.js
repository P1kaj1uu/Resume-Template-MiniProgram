const store=require('../../utils/data');
Page({
 data:{count:0,templateCount:store.templates.length,favoriteCount:0,loadError:''},
 onShow(){const bar=this.getTabBar();if(bar)bar.setData({selected:3});try{this.setData({count:store.all().length,favoriteCount:store.favorites().length,loadError:''});}catch(e){this.setData({loadError:e.message||'本机资料暂时无法读取'});}},
 legal(e){wx.navigateTo({url:'/pages/legal/legal?type='+e.currentTarget.dataset.type});},
 help(){wx.showModal({title:'使用小贴士',content:'1. 选模板后就能开始写，编辑内容会自动保存。\n2. 简历、收藏和版本记录只保存在当前设备。\n3. 预览准备好后，点击下载即可保存或发送文件。\n4. 简历体检可选择本机简历、读取文件或粘贴文字。\n5. 换设备、卸载或清理微信数据前，请先导出重要简历。',showCancel:false});},
 storageInfo(){wx.showModal({title:'资料保存在当前设备',content:'简历草稿、历史版本、收藏和模板解锁记录都使用当前设备的小程序本地存储。不同设备不会自动同步。清理微信数据、卸载或更换设备可能使这些内容丢失，请及时导出重要简历。',showCancel:false});},
 goResumes(){wx.switchTab({url:'/pages/resumes/resumes'});},
 goTemplates(){try{wx.removeStorageSync('template_target_v1');wx.switchTab({url:'/pages/templates/templates'});}catch(e){wx.showToast({title:'模板记录暂时无法读取，请重试',icon:'none'});}},
 favorites(){try{wx.removeStorageSync('template_target_v1');wx.setStorageSync('template_access_v1','收藏');wx.switchTab({url:'/pages/templates/templates'});}catch(e){wx.showToast({title:'暂时无法打开收藏，请检查本机空间',icon:'none'});}},
 optimize(){wx.navigateTo({url:'/pages/optimize/optimize'});}
});

