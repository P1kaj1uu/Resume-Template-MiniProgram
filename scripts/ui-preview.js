// Render actual WXML and WXSS into a local visual-review artifact. No app data is read.
const fs=require('node:fs'),path=require('node:path'),sax=require('sax');
const width=Number(process.env.UI_WIDTH)||375,height=Number(process.env.UI_HEIGHT)||812,ratio=width/750;
const root=path.resolve(__dirname,'../miniprogram'),out=path.resolve(__dirname,'../artifacts/ui'+(width===375?'':'-'+width));
const store=require('../.build/miniprogram/utils/data'),{templates}=require('../.build/miniprogram/utils/catalog'),{effectiveDesign}=require('../.build/miniprogram/utils/content-schema'),{layoutFor,sectionsFor,partitionSections}=require('../.build/miniprogram/utils/layout'),icons=require('../.build/miniprogram/utils/icons');
fs.mkdirSync(out,{recursive:true});
const escape=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function expr(value,data){try{return Function('data','with(data){return ('+value+')}')(data);}catch(e){return '';}}
function value(raw,data){if(typeof raw!=='string')return raw;const exact=raw.match(/^\{\{([\s\S]*)\}\}$/);return exact?expr(exact[1],data):raw.replace(/\{\{([\s\S]*?)\}\}/g,(_,code)=>expr(code,data));}
const trees={};function tree(file){if(trees[file])return trees[file];const result={children:[]},stack=[result],parser=sax.parser(false,{lowercase:true});parser.onopentag=n=>{const next={tag:n.name.toLowerCase(),attrs:n.attributes,children:[]};stack.at(-1).children.push(next);stack.push(next);};parser.onclosetag=()=>stack.pop();parser.ontext=text=>stack.at(-1).children.push({text});parser.write('<root>'+fs.readFileSync(path.join(root,file),'utf8').replace(/\s(back|auto-height|scroll-x)(?=\s|\/?>)/g,' $1="true"')+'</root>').close();return trees[file]=result.children[0].children;}
function css(file,seen=new Set()){if(seen.has(file))return '';seen.add(file);return fs.readFileSync(path.join(root,file),'utf8').replace(/@import\s+"([^"]+)";/g,(_,relative)=>css(path.join(path.dirname(file),relative),seen));}
function units(text){return text.replace(/(-?\d*\.?\d+)rpx/g,(_,n)=>Number(n)*ratio+'px').replace(/(^|[\s,>])page(?=[\s:{])/g,'$1.surface').replace(/(^|[\s,>])view(?=[\s,.{:#\[>])/g,'$1div').replace(/(^|[\s,>])text(?=[\s,.{:#\[>])/g,'$1span');}
function children(nodes,data){let chain=false,inChain=false;return nodes.map(n=>{if(n.text!==undefined)return escape(value(n.text,data));const a=n.attrs;if(a['wx:if']!==undefined&&!a['wx:for']){inChain=true;chain=!!value(a['wx:if'],data);return chain?render(n,data,true):'';}if(a['wx:elif']!==undefined){const show=inChain&&!chain&&!!value(a['wx:elif'],data);chain=chain||show;return show?render(n,data,true):'';}if(a['wx:else']!==undefined){const show=inChain&&!chain;inChain=false;return show?render(n,data,true):'';}inChain=false;return render(n,data);}).join('');}
function render(n,data,skip=false){
 const a=n.attrs||{};
 if(a['wx:for']&&!skip){const rows=value(a['wx:for'],data)||[];return rows.map((item,index)=>render({...n,attrs:{...a,'wx:for':''}},{...data,[a['wx:for-item']||'item']:item,[a['wx:for-index']||'index']:index})).join('');}
 if(!skip&&a['wx:if']!==undefined&&!value(a['wx:if'],data))return '';
 const attrs=Object.fromEntries(Object.entries(a).map(([k,v])=>[k,value(v,data)]));
 if(n.tag==='page-head')return children(tree('components/page-head/page-head.wxml'),{title:attrs.title||'好简历',back:attrs.back!==undefined&&attrs.back!==false,top:18,height:44,right:16});
 if(n.tag==='ui-icon'){const size=(Number(attrs.size)||36)*(attrs.unit==='px'?1:ratio),color=attrs.color||'inherit',src=icons.source(attrs.name,attrs.filled===true||attrs.filled==='true',attrs.weight||1.8);return '<ui-icon style="display:inline-flex;vertical-align:middle;flex-shrink:0;line-height:0;color:'+color+'"><span style="display:block;width:'+size+'px;height:'+size+'px;background:currentColor;mask:url('+src+') center/100% 100% no-repeat;-webkit-mask:url('+src+') center/100% 100% no-repeat"></span></ui-icon>';}
 if(n.tag==='resume-paper'){
  const content=attrs.content||store.sample,resolved=effectiveDesign(attrs.design||templates[0],content),sections=sectionsFor(content,resolved),parts=partitionSections(sections,resolved),thumb=rows=>rows.map(s=>({...s,preview:s.entries[0]?.primary||s.body.slice(0,34)}));
  return children(tree('components/resume-paper/resume-paper.wxml'),{content,resolved,layout:layoutFor(resolved),sections,side:parts.side,main:parts.main,thumbSide:thumb(parts.side),thumbMain:thumb(parts.main),thumbnail:attrs.thumbnail});
 }
 if(n.tag==='resume-section')return children(tree('components/resume-section/resume-section.wxml'),attrs);
 if(n.tag==='block')return children(n.children,data);
 if(n.tag==='switch')return '<span class="mock-switch '+(attrs.checked?'checked':'')+'"></span>';
 const tag=n.tag==='text'?'span':['view','scroll-view','picker','checkbox-group','label'].includes(n.tag)?'div':n.tag;
 let htmlAttrs='';for(const key of ['class','id','style','placeholder','value','type'])if(attrs[key]!==undefined)htmlAttrs+=' '+key+'="'+escape(String(attrs[key]).replace(/(-?\d*\.?\d+)rpx/g,(_,n)=>Number(n)/2+'px'))+'"';
 if(attrs.disabled)htmlAttrs+=' disabled';
 if(n.tag==='image'){
  const relative=String(attrs.src||'').replace(/^\//,''),target=path.join(out,'assets',relative);
  if(relative&&fs.existsSync(path.join(root,relative))){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);}
  return '<img'+htmlAttrs+' src="assets/'+escape(relative)+'" alt="'+escape(attrs['aria-label']||'')+'"/>';
 }
 if(tag==='input')return '<input'+htmlAttrs+' readonly/>';
 return '<'+tag+htmlAttrs+'>'+children(n.children,data)+'</'+tag+'>';
}
const tabs=[{name:'首页',path:'index',icon:'home'},{name:'模板',path:'templates',icon:'grid'},{name:'简历',path:'resumes',icon:'file'},{name:'我的',path:'profile',icon:'user'}];
const resume={id:'sample',title:'我的求职简历',templateId:'classic',content:store.blank()};
const {sectionRows}=require('../.build/miniprogram/utils/layout'),{preferenceOptions}=require('../.build/miniprogram/utils/editor-fields');
let authorData;
require('node:vm').runInNewContext(fs.readFileSync(path.resolve(__dirname,'../.build/miniprogram/packages/author/index/index.js'),'utf8'),{exports:{},Page:page=>authorData=page.data});
const frames=[
 {id:'author',title:'联系作者',file:'packages/author/index/index',data:authorData},
 {id:'home',title:'首页',file:'pages/index/index',tab:0,data:{featured:templates.slice(0,4),templateCount:320,layoutCount:32,resumeCount:0,recent:null}},
 {id:'templates',title:'模板馆',file:'pages/templates/templates',tab:1,data:{target:null,catalogCount:320,layoutCount:32,query:'',categories:['全部','通用','应届生','产品岗','技术岗'],active:'全部',access:'全部',favoriteCount:1,groups:['全部版式'],groupIndex:0,total:320,list:templates.slice(0,6).map((t,i)=>({...t,favorite:i===1})),hasMore:true,shown:18}},
 {id:'editor',title:'编辑与返回',file:'pages/editor/editor',data:{resume,progress:0,saved:'已保存至本机',active:0,tabs:['基本资料','经历项目','补充内容','排版设置'],templates,templateIndex:0}},
 {id:'settings',title:'栏目排序与设置',file:'pages/editor/editor',data:{resume,progress:0,saved:'已保存至本机',active:3,tabs:['基本资料','经历项目','补充内容','排版设置'],templates,templateIndex:0,orderRows:sectionRows(resume.content,templates[0]),versions:[],preferenceOptions,preferenceGroups:[{key:'fontSize',title:'正文字号'},{key:'spacing',title:'段落间距'},{key:'margin',title:'页面留白'}]}},
 {id:'profile',title:'本机简历夹',file:'pages/profile/profile',tab:3,data:{count:2,templateCount:320,favoriteCount:5}},
 {id:'pdf',title:'本机文件',file:'packages/pdf-reader/index/index',data:{file:null,job:'',busy:false,error:'',report:null}}
];
const reset='html,body{margin:0;padding:0;width:'+width+'px;background:#f6f7f2}body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}input,textarea,button{font-family:inherit}button{border:0;cursor:pointer}input,textarea{border:0;outline:none;resize:none}input{background:transparent;box-sizing:border-box}button::after{display:none}.surface{min-height:'+height+'px;position:relative;overflow:hidden}.surface>.fixed-actions,.tab-bar{position:fixed}.mock-switch{display:block;width:38px;height:22px;background:#dce3d6;border-radius:22px}.mock-switch.checked{background:#315d4d}.mock-switch:after{content:"";display:block;width:18px;height:18px;margin:2px;background:white;border-radius:50%}.mock-switch.checked:after{margin-left:18px}';
for(const frame of frames){const styles=['app.wxss','components/page-head/page-head.wxss','custom-tab-bar/index.wxss','components/resume-paper/resume-paper.wxss','components/resume-section/resume-section.wxss',frame.file+'.wxss'].map(f=>css(f)).join('\n');const content=children(tree(frame.file+'.wxml'),frame.data)+(frame.tab!==undefined?children(tree('custom-tab-bar/index.wxml'),{tabs,selected:frame.tab}):'');fs.writeFileSync(path.join(out,frame.id+'.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+frame.title+' · 外观核对</title><style>'+reset+units(styles)+'</style><body><div class="surface">'+content+'</div></body></html>');}
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>界面外观核对</title><style>body{margin:0;background:#e9ece5;font-family:-apple-system,"PingFang SC",sans-serif;color:#40543b;padding:30px}h1{font-size:22px;font-weight:550;margin:0 0 8px}p{font-size:13px;color:#87967b}.frames{display:flex;gap:24px;margin-top:25px}.frame{flex-shrink:0}h2{font-size:14px;font-weight:500}iframe{width:'+width+'px;height:'+height+'px;border:1px solid #d7dfcf;border-radius:20px;background:white}</style><h1>好简历 · 界面外观核对</h1><p>使用项目实际页面结构与样式生成的静态预览，展示示例数据，仅用于核对视觉效果。</p><div class="frames">'+frames.map(f=>'<div class="frame"><h2>'+f.title+'</h2><iframe src="'+f.id+'.html"></iframe></div>').join('')+'</div></html>');
console.log('已生成 '+frames.length+' 个页面的静态外观预览：artifacts/ui/index.html');
