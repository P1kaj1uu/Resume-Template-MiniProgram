const config=require('../config');
const {read,write}=require('./storage');
const session=new Set();
function records(){const value=read('template_unlocks',[]);return Array.isArray(value)?value.filter(id=>typeof id==='string'):[];}
function unlocked(id){return session.has(id)||records().includes(id);}
function unlock(id){
 if(unlocked(id))return Promise.resolve({persisted:true});
 if(!config.rewardedAdUnitId)return Promise.reject(new Error('广告暂未准备好，请先体验免费模板。'));
 return new Promise((resolve,reject)=>{
  let ad,settled=false;
  const clean=()=>{if(ad){if(typeof ad.offClose==='function')ad.offClose(close);if(typeof ad.offError==='function')ad.offError(error);}};
  const fail=message=>{if(settled)return;settled=true;clean();reject(new Error(message));};
  const close=res=>{
   if(settled)return;if(!res||!res.isEnded){fail('完整观看后才能解锁，你也可以选择免费模板。');return;}
   let persisted=true;
   try{const ids=records();if(!ids.includes(id))ids.push(id);write('template_unlocks',ids);}
   catch(e){persisted=false;session.add(id);}
   settled=true;clean();resolve({persisted});
  };
  const error=()=>fail('广告加载失败，暂未发放解锁权益，请稍后再试。');
  try{ad=wx.createRewardedVideoAd({adUnitId:config.rewardedAdUnitId});ad.onClose(close);ad.onError(error);Promise.resolve(ad.show()).catch(()=>Promise.resolve(ad.load()).then(()=>ad.show()).catch(error));}
  catch(e){error();}
 });
}
module.exports={unlocked,unlock};
