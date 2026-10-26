const {test,beforeEach}=require('node:test'),assert=require('node:assert/strict');
const store=require('../miniprogram/utils/data'),pdf=require('../miniprogram/utils/pdf');
const {templates}=require('../miniprogram/utils/catalog');
const {normalizeContent}=require('../miniprogram/utils/content-schema');
const {sectionsFor,partitionSections}=require('../miniprogram/utils/layout');
const {review}=require('../miniprogram/utils/review');
const {detailed}=require('./fixtures');
let memory={};
const put=(key,value)=>{memory[key]=JSON.parse(JSON.stringify(value));};
beforeEach(()=>{memory={};global.wx={getStorageSync:key=>memory[key]&&JSON.parse(JSON.stringify(memory[key])),setStorageSync:put};});
test('legacy resumes migrate without truncating text and gain empty optional fields',()=>{
 const detail='较长的原有经历。'.repeat(800)+'原文结束';
 memory.resumes_v1=[{id:'legacy',title:'旧简历',templateId:'classic',content:{...store.sample,experience:[{...store.sample.experience[0],detail}]}}];
 const r=store.get('legacy');assert.equal(r.content.experience[0].detail,detail);
 assert.deepEqual(r.content.certificates,[]);assert.deepEqual(r.content.hiddenSections,[]);assert.equal(r.content.preferences.fontSize,'normal');
 store.save(r);assert.equal(store.get('legacy').content.experience[0].detail,detail);
});
test('all optional sections appear and partition without duplication in every layout',()=>{
 const c=detailed();
 for(const t of templates.slice(0,32)){
  const sections=sectionsFor(c,t),p=partitionSections(sections,t);
  assert.equal(sections.length,11,t.id);assert.equal(p.main.length+p.side.length,11,t.id);
  assert.equal(new Set([...p.main,...p.side].map(s=>s.key)).size,11,t.id);
 }
});
test('hiding and ordering sections preserve original data',()=>{
 const c=detailed(),body=c.certificates[0].detail;
 c.hiddenSections=['certificates','custom_custom1'];c.sectionOrder=['links','education','summary'];
 const rows=sectionsFor(c,templates[0]);assert.equal(rows[0].key,'links');assert.equal(rows[1].key,'education');
 assert.ok(!rows.some(s=>s.key==='certificates'||s.key==='custom_custom1'));assert.equal(c.certificates[0].detail,body);assert.equal(c.customSections.length,1);
});
test('blank entries are omitted and do not inflate completeness',()=>{
 const c=store.blank();c.education=[{id:'blank',school:'',major:'',period:'',detail:''}];c.projects=[{id:'blank2',name:'',role:'',period:'',detail:''}];
 assert.equal(sectionsFor(c,templates[0]).length,0);assert.equal(store.completion(c),0);
});
test('a dual-column resume expands to full width when one column is empty or hidden',async()=>{
 const parse=require('pdf-parse/lib/pdf-parse.js'),t=templates.find(t=>t.id==='sidebar');
 for(const sideOnly of [true,false]){
  const c=store.blank(),marker='甲'.repeat(42);c.name='测试姓名';c.role='求职岗位';
  if(sideOnly)c.summary=marker;else c.experience=[{id:'work',company:'示例单位',position:'岗位',period:'',detail:marker}];
  const sections=sectionsFor(c,t),parts=partitionSections(sections,t);
  assert.deepEqual(parts,{main:sections,side:[]});
  // Small Node Buffers share a pool; the old parser requires a standalone byte array.
  const parsed=await parse(new Uint8Array(Buffer.from(pdf.buildResume({content:c},t),'ascii')));
  assert.ok(parsed.text.includes(marker),'单边内容应使用整页宽度');
 }
 const c=detailed();c.hiddenSections=['summary','education','skills','certificates','languages','links'];
 assert.equal(partitionSections(sectionsFor(c,t),t).side.length,0);
});
test('all layouts export additional sections and retain clickable portfolio URI',async()=>{
 const parse=require('pdf-parse/lib/pdf-parse.js'),c=detailed();
 for(const t of templates.slice(0,32)){
  const output=pdf.buildResume({content:c},t),parsed=await parse(Buffer.from(output,'ascii')),text=parsed.text.replace(/\s/g,'');
  for(const marker of ['实习单位示例','数据分析职业证书','校级实践成果奖','大学英语六级','个人作品集','志愿服务'])assert.ok(text.includes(marker),t.id+':'+marker);
  assert.match(output,/\/Subtype \/Link/);assert.match(output,/\/Annots \[/);
  const uris=[...output.matchAll(/\/URI <([0-9a-f]+)>/g)].map(m=>Buffer.from(m[1],'hex').toString('utf8'));
  assert.ok(uris.includes(c.links[0].url),t.id);assert.ok(!uris.some(url=>url.includes('%2520')),t.id);
  assert.equal(pdf.pageCount({content:c},t),parsed.numpages);
 }
});
test('hidden optional content stays out of exported text',async()=>{
 const c=detailed();c.hiddenSections=['certificates','custom_custom1'];
 const output=pdf.buildResume({content:c},templates[0]);const parsed=await require('pdf-parse/lib/pdf-parse.js')(Buffer.from(output,'ascii'));
 assert.ok(!parsed.text.replace(/\s/g,'').includes('数据分析职业证书'));assert.ok(!parsed.text.includes('志愿服务'));assert.equal(c.certificates.length,1);
});
test('font, spacing and margins alter pagination without losing text',async()=>{
 const c=detailed();c.experience[0].detail='用真实的工作行动与结果，介绍自己的能力。'.repeat(160)+'排版测试结束';
 c.preferences={fontSize:'large',spacing:'relaxed',margin:'wide'};const large=pdf.buildResume({content:c},templates[0]);
 c.preferences={fontSize:'small',spacing:'compact',margin:'narrow'};const small=pdf.buildResume({content:c},templates[0]);
 const parse=require('pdf-parse/lib/pdf-parse.js'),a=await parse(Buffer.from(large,'ascii')),b=await parse(Buffer.from(small,'ascii'));
 assert.ok(a.numpages>b.numpages);
 assert.ok(a.text.replace(/\s/g,'').includes('排版测试结束'));assert.ok(b.text.replace(/\s/g,'').includes('排版测试结束'));
});
test('local persistence round-trip preserves optional content, order and typography',()=>{
 const r=store.create('panel-plum');r.content=detailed();r.content.hiddenSections=['awards'];r.content.sectionOrder=['links','summary'];r.content.preferences={fontSize:'large',spacing:'relaxed',margin:'wide'};
 store.save(r);const result=store.get(r.id);assert.deepEqual(result.content,normalizeContent(r.content));assert.equal(result.templateId,'panel-plum');
});
test('saved versions restore the oldest retained snapshot and retain an undo version',()=>{
 let r=store.create('classic',true);
 for(let i=0;i<7;i++){r=store.save({...r,title:'版本 '+i,content:{...r.content,name:'姓名'+i}});store.checkpoint(r.id);}
 const rows=store.versions(r.id);assert.equal(rows.length,5);const target=rows[4],current=store.get(r.id);
 const restored=store.restoreVersion(r.id,target.id);assert.equal(restored.id,r.id);assert.equal(restored.content.name,target.snapshot.content.name);
 assert.equal(store.versions(r.id)[0].snapshot.content.name,current.content.name);
 assert.equal(store.versions(r.id)[0].label,'恢复版本前的内容');
});
test('template changes preserve a snapshot including hidden sections and settings',()=>{
 const r=store.create();r.content=detailed();r.content.hiddenSections=['awards'];r.content.preferences.fontSize='large';store.save(r);
 store.changeTemplate(r.id,'arch-plum');const v=store.versions(r.id)[0];
 assert.equal(v.label,'更换模板前');assert.equal(v.snapshot.templateId,'classic');assert.equal(v.snapshot.content.preferences.fontSize,'large');assert.deepEqual(v.snapshot.content.hiddenSections,['awards']);
});
test('storage failure while checkpointing prevents destructive restoration',()=>{
 let r=store.create('classic',true);const v=store.checkpoint(r.id);r=store.save({...r,content:{...r.content,name:'当前内容'}});
 global.wx.setStorageSync=(key,value)=>{if(key==='resume_versions_v1')throw new Error('storage full');put(key,value);};
 assert.throws(()=>store.restoreVersion(r.id,v.id),/保存失败/);assert.equal(store.get(r.id).content.name,'当前内容');
});
test('deleting a resume removes only its own local versions',()=>{
 const a=store.create(),b=store.create();store.checkpoint(a.id);store.checkpoint(b.id);store.remove(a.id);
 assert.equal(store.versions(a.id).length,0);assert.equal(store.versions(b.id).length,1);assert.ok(store.get(b.id));
});
test('preflight reports actionable errors and ignores a hidden invalid link',()=>{
 const c=detailed();c.email='错误邮箱';c.links[0].url='不是完整地址';
 const a=review(c);assert.ok(a.errors.some(x=>x.path==='email'));assert.ok(a.errors.some(x=>x.path==='links'&&x.tab===2));
 c.email='person@example.com';c.hiddenSections=['links'];assert.equal(review(c).errors.length,0);
 c.phone='';c.email='';assert.ok(review(c).warnings.some(x=>x.path==='phone'));
});




