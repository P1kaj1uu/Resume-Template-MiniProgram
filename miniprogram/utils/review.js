const {normalizeContent,entryFields,meaningful}=require('./content-schema');
function review(input){
 const c=normalizeContent(input),errors=[],warnings=[];
 const add=(list,title,path,tab)=>list.push({title,path,tab});
 if(!c.name.trim())add(errors,'请填写姓名','name',0);
 if(!c.role.trim())add(errors,'请填写目标职位','role',0);
 if(c.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))add(errors,'请检查电子邮箱格式','email',0);
 for(const link of (c.hiddenSections.includes('links')?[]:c.links))if(link.url&&!/^https?:\/\/[^\/\s?#]+(?:[/?#][^\s]*)?$/i.test(link.url.trim()))add(errors,'作品链接需要填写完整的网址','links',2);
 if(!c.phone.trim()&&!c.email.trim())add(warnings,'还没有留下联系电话或邮箱','phone',0);
 if(!['experience','internships','projects'].some(key=>c[key].some(e=>meaningful(e,entryFields[key]))))add(warnings,'可以补充一段工作、实习或项目经历','experience',1);
 for(const [key,fields] of Object.entries(entryFields)){
  if(c[key].some(e=>!meaningful(e,fields)))add(warnings,'有空白条目，导出时会自动略过',key,key==='customSections'||['certificates','awards','languages','links'].includes(key)?2:1);
 }
 if(c.role.length>30)add(warnings,'目标职位较长，建议缩短为重点岗位','role',0);
 return {errors,warnings: warnings.filter((v,i,a)=>a.findIndex(x=>x.title===v.title)===i)};
}
module.exports={review};

