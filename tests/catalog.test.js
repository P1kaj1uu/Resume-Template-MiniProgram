const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {templates,families,filterTemplates}=require('../.build/miniprogram/utils/catalog');
const {layoutFor,sectionsFor,partitionSections}=require('../.build/miniprogram/utils/layout');
const store=require('../.build/miniprogram/utils/data');
const pdf=require('../.build/miniprogram/utils/pdf');
let memory={};
global.wx={getStorageSync:key=>memory[key]&&JSON.parse(JSON.stringify(memory[key])),setStorageSync:(key,value)=>memory[key]=JSON.parse(JSON.stringify(value))};
beforeEach(()=>{memory={};});
test('320 named templates have 32 layouts, ten variants each and unique IDs',()=>{
 assert.equal(templates.length,320);assert.equal(families.length,32);
 assert.equal(new Set(templates.map(t=>t.id)).size,320);
 assert.equal(new Set(templates.map(t=>t.name)).size,320);
 assert.equal(new Set(templates.map(t=>t.style)).size,32);
 for(const family of families)assert.equal(templates.filter(t=>t.familyId===family.id).length,10);
 assert.ok(templates.filter(t=>t.free).length>=180);
 for(const t of templates){assert.match(t.color,/^#[0-9a-f]{6}$/i);assert.ok(!/[A-Za-z]/.test(t.name+t.caption+t.tags.join('')));}
});
test('combined search, role, access and favorites filters return the intersection',()=>{
 const results=filterTemplates({category:'技术岗',access:'免费'});
 assert.ok(results.length>0);assert.ok(results.every(t=>t.free&&t.categories.includes('技术岗')));
 const chosen=results[0],favorites=[chosen.id,'classic'];
 assert.deepEqual(filterTemplates({category:'技术岗',access:'收藏',favorites}).map(t=>t.id),[chosen.id]);
 assert.ok(filterTemplates({query:'靛蓝',group:'双栏'}).every(t=>t.palette==='靛蓝'&&t.group==='双栏'));
 assert.equal(filterTemplates({query:'不存在的模板名称'}).length,0);
});
test('favorites persist, toggle independently and discard removed template IDs',()=>{
 store.toggleFavorite('classic');store.toggleFavorite('sidebar-navy');
 assert.deepEqual(store.favorites(),['classic','sidebar-navy']);
 store.toggleFavorite('classic');assert.deepEqual(store.favorites(),['sidebar-navy']);
 memory.favorite_templates_v1.push('removed-template');assert.deepEqual(store.favorites(),['sidebar-navy']);
});
test('changing template preserves all resume content and its identity',()=>{
 const r=store.create('classic',true),before=JSON.stringify(r.content),created=r.createdAt;
 const next=store.changeTemplate(r.id,'sidebar-navy');
 assert.equal(next.id,r.id);assert.equal(next.createdAt,created);assert.equal(JSON.stringify(next.content),before);
 assert.equal(store.get(r.id).templateId,'sidebar-navy');assert.equal(store.all().length,1);
 assert.throws(()=>store.changeTemplate('missing','classic'),/不存在/);
});
test('layout partition never drops or duplicates a nonempty section',()=>{
 for(const t of templates){const sections=sectionsFor(store.sample,t),parts=partitionSections(sections,t);assert.equal(sections.length,5);assert.deepEqual([...parts.main,...parts.side].map(s=>s.key).sort(),sections.map(s=>s.key).sort());assert.ok(layoutFor(t).header);}
 assert.equal(sectionsFor(store.sample,templates.find(t=>t.id==='tech'))[1].key,'projects');
 assert.equal(sectionsFor(store.sample,templates.find(t=>t.id==='campus'))[1].key,'education');
});
test('all 32 layouts retain the ends of long text in both columns across pages',async()=>{
 const parse=require('pdf-parse/lib/pdf-parse.js');
 for(const t of templates.slice(0,32)){
  const content=JSON.parse(JSON.stringify(store.sample));
  content.summary='说明自己的优势与真实经历。'.repeat(350)+'侧栏内容完整结束';
  content.experience[0].detail='写清楚工作内容与带来的成果。'.repeat(350)+'主栏内容完整结束';
  const parsed=await parse(Buffer.from(pdf.buildResume({content},t),'ascii'));
  assert.ok(parsed.numpages>1,t.id);const text=parsed.text.replace(/\s/g,'');
  assert.ok(text.includes('侧栏内容完整结束'),t.id);assert.ok(text.includes('主栏内容完整结束'),t.id);
 }
});
test('built-in page text and template ornament contain no English words',()=>{
 const root=path.resolve(__dirname,'../.build/miniprogram');
 function check(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())check(p);else if(p.endsWith('.wxml')){
  const source=fs.readFileSync(p,'utf8').replace(/\{\{[\s\S]*?\}\}/g,m=>(m.match(/'[^']*'/g)||[]).join('')).replace(/<[^>]*>/g,'');
  assert.ok(!/[A-Za-z]{2,}/.test(source),path.relative(root,p)+': '+source.match(/[A-Za-z]{2,}/));
 }}}
 check(root);
});
test('new-arrival filter exposes all 200 additions while keeping existing favorites stable',()=>{const fresh=filterTemplates({access:'新增'});assert.equal(fresh.length,200);assert.ok(fresh.every(t=>t.isNew));assert.ok(fresh.some(t=>t.id==='folio'));assert.ok(fresh.some(t=>t.id==='classic-plum'));assert.equal(templates.find(t=>t.id==='classic').isNew,false);});


