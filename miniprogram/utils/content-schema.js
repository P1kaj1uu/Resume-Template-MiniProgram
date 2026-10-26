const entryFields={
 education:['school','major','period','detail'],
 experience:['company','position','period','detail'],
 internships:['company','position','period','detail'],
 projects:['name','role','period','detail'],
 certificates:['name','issuer','period','detail'],
 awards:['name','issuer','period','detail'],
 languages:['name','level','detail'],
 links:['name','url','detail'],
 customSections:['title','detail']
};
const sectionNames={summary:'个人优势',experience:'工作经历',internships:'实习经历',projects:'项目经历',education:'教育经历',skills:'专业技能',certificates:'资格证书',awards:'荣誉奖项',languages:'语言能力',links:'作品与链接'};
const sectionKeys=Object.keys(sectionNames);
const defaults={fontSize:'normal',spacing:'template',margin:'template'};
function cleanString(value,max=100){return typeof value==='string'?value:'';}
function entryId(value,index){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value)?value:'entry_'+index;}
function validKey(key){return sectionKeys.includes(key)||/^custom_[A-Za-z0-9_-]{1,80}$/.test(key);}
function preferences(value={}){
 return {
  fontSize:['small','normal','large'].includes(value.fontSize)?value.fontSize:defaults.fontSize,
  spacing:['template','compact','standard','relaxed'].includes(value.spacing)?value.spacing:defaults.spacing,
  margin:['template','narrow','standard','wide'].includes(value.margin)?value.margin:defaults.margin
 };
}
function normalizeContent(input={}){
 const c={};
 for(const key of ['name','role','phone','email','city','summary','skills'])c[key]=cleanString(input[key],['summary','skills'].includes(key)?1200:100);
 for(const [key,fields] of Object.entries(entryFields))c[key]=(Array.isArray(input[key])?input[key]:[]).filter(e=>e&&typeof e==='object').map((entry,index)=>{
  const next={id:entryId(entry.id,index)};
  fields.forEach(field=>next[field]=cleanString(entry[field],field==='detail'?2400:field==='url'?400:100));
  return next;
 });
 c.preferences=preferences(input.preferences||{});
 c.sectionOrder=Array.isArray(input.sectionOrder)?[...new Set(input.sectionOrder.filter(validKey))].slice(0,50):[];
 c.hiddenSections=Array.isArray(input.hiddenSections)?[...new Set(input.hiddenSections.filter(validKey))].slice(0,50):[];
 return c;
}
function meaningful(entry,fields){return fields.some(field=>typeof entry[field]==='string'&&entry[field].trim());}
function effectiveDesign(template,content={}){
 const pref=preferences(content.preferences||{});
 const scale={small:.92,normal:1,large:1.1}[pref.fontSize];
 const padding=pref.margin==='narrow'?6:pref.margin==='standard'?8:pref.margin==='wide'?10:template.style==='compact'?6:template.style==='framed'?7:8;
 return {...template,density:pref.spacing==='template'?template.density:pref.spacing,fontScale:scale,bodySize:16*scale,entrySize:18*scale,secondarySize:16*scale,headingSize:21*scale,paperPadding:padding,headerBleed:padding/(1-padding/50),marginInset:pref.margin==='narrow'?34:pref.margin==='wide'?56:44};
}
module.exports={entryFields,sectionNames,sectionKeys,defaults,normalizeContent,preferences,meaningful,validKey,effectiveDesign};

