const layouts = {
  classic: { header:'plain', heading:'line' },
  campus: { header:'plain', heading:'fill', educationFirst:true },
  business: { header:'dark', heading:'line' },
  minimal: { header:'center', heading:'rule' },
  creative: { header:'plain', heading:'bar', edge:true },
  tech: { header:'plain', heading:'bar', projectsFirst:true },
  editorial: { header:'editorial', heading:'number', serif:true },
  outline: { header:'bordered', heading:'frame' },
  sidebar: { header:'plain', heading:'line', columns:'left' },
  split: { header:'plain', heading:'rule', columns:'right' },
  timeline: { header:'plain', heading:'dot' },
  boxed: { header:'plain', heading:'box' },
  framed: { header:'plain', heading:'rule', frame:true },
  centered: { header:'center', heading:'pill' },
  ribbon: { header:'ribbon', heading:'bar', educationFirst:true },
  serif: { header:'serif', heading:'rule', serif:true },
  compact: { header:'compact', heading:'split', compact:true },
  mosaic: { header:'plain', heading:'fill', columns:'equal' },
  profile: { header:'identity', heading:'bar', columns:'profile' },
  ledger: { header:'ledger', heading:'split' },
  folio:{header:'folio',heading:'number',serif:true},
  banner:{header:'banner',heading:'fill'},
  rail:{header:'plain',heading:'bar',edgeRight:true},
  catalogue:{header:'catalogue',heading:'number'},
  duotone:{header:'bordered',heading:'double'},
  horizon:{header:'horizon',heading:'line'},
  notebook:{header:'serif',heading:'dash',serif:true},
  arch:{header:'arch',heading:'pill'},
  panel:{header:'dark',heading:'bar',columns:'panel'},
  letter:{header:'letter',heading:'letter',serif:true},
  marker:{header:'marker',heading:'tab',educationFirst:true},
  margin:{header:'compact',heading:'margin'}
};
const {normalizeContent,entryFields,sectionNames,meaningful}=require('./content-schema');
function layoutFor(t={}){return layouts[t.style]||layouts.classic;}
function defaultOrder(t={}){
 const layout=layoutFor(t),middle=layout.projectsFirst?['projects','experience','internships','education']:layout.educationFirst?['education','experience','internships','projects']:['experience','internships','projects','education'];
 return ['summary',...middle,'skills','certificates','awards','languages','links'];
}
function sectionRows(input,t={}){
 const c=normalizeContent(input),custom=c.customSections.map((e,i)=>({key:'custom_'+e.id,title:e.title||'自定义栏目 '+(i+1)}));
 const base=defaultOrder(t).map(key=>({key,title:sectionNames[key]})).concat(custom);
 const order=[...c.sectionOrder,...base.map(s=>s.key)];
 return [...new Set(order)].map(key=>base.find(s=>s.key===key)).filter(Boolean).map(row=>({...row,hidden:c.hiddenSections.includes(row.key)}));
}
function sectionsFor(input,t={}){
 const c=normalizeContent(input),byKey={};
 const addText=key=>{if(c[key].trim())byKey[key]={key,title:sectionNames[key],body:c[key],entries:[]};};
 const addEntries=(key,primary,secondary)=>{
  const entries=c[key].filter(e=>meaningful(e,entryFields[key])).map(e=>({id:e.id,primary:e[primary]||'待补充',secondary:e[secondary]||'',period:e.period||'',detail:e.detail||''}));
  if(entries.length)byKey[key]={key,title:sectionNames[key],entries,body:''};
 };
 addText('summary');addText('skills');
 addEntries('education','school','major');addEntries('experience','company','position');addEntries('internships','company','position');addEntries('projects','name','role');
 addEntries('certificates','name','issuer');addEntries('awards','name','issuer');addEntries('languages','name','level');addEntries('links','name','url');
 for(const entry of c.customSections){if(entry.title.trim()||entry.detail.trim())byKey['custom_'+entry.id]={key:'custom_'+entry.id,title:entry.title||'补充内容',body:entry.detail,entries:[]};}
 return sectionRows(c,t).filter(row=>!row.hidden&&byKey[row.key]).map((row,i)=>({...byKey[row.key],number:String(i+1).padStart(2,'0')}));
}
function partitionSections(sections,t={}){
 const layout=layoutFor(t);
 if(!layout.columns)return {main:sections,side:[]};
 const sideKeys=layout.columns==='equal'?['summary','education','languages']:['summary','education','skills','certificates','languages','links'];
 const main=sections.filter(s=>!sideKeys.includes(s.key)),side=sections.filter(s=>sideKeys.includes(s.key));
 return main.length&&side.length?{main,side}:{main:sections,side:[]};
}
module.exports={layouts,layoutFor,defaultOrder,sectionRows,sectionsFor,partitionSections};


