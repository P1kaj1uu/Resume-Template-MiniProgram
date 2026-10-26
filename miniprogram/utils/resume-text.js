const {normalizeContent}=require('./content-schema');
const {sectionsFor}=require('./layout');
const {findTemplate}=require('./catalog');
function resumeText(resume){
 const c=normalizeContent(resume.content||{}),lines=[c.name,c.role,c.phone,c.email,c.city];
 for(const section of sectionsFor(c,findTemplate(resume.templateId))){
  lines.push(section.title,section.body);
  for(const e of section.entries)lines.push(e.primary,e.secondary,e.period,e.detail);
 }
 return lines.filter(v=>typeof v==='string'&&v.trim()).join('\n');
}
module.exports={resumeText};
