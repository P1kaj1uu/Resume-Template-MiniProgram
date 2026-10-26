// A4、可检索文本 PDF。内嵌精简中文 CMap，兼容离线文本解析器。
const ranges=require('./cmap');
function cid(code){let a=0,b=ranges.length-1;while(a<=b){const m=(a+b)>>1,r=ranges[m];if(code<r[0])b=m-1;else if(code>r[1])a=m+1;else return r[2]+code-r[0];}return 0;}
function hex(s){let out='';for(let i=0;i<s.length;i++)out+=s.charCodeAt(i).toString(16).padStart(4,'0');return out;}
function rgb(color){return [1,3,5].map(i=>(parseInt(color.slice(i,i+2),16)/255).toFixed(3)).join(' ');}
function width(s,size){return Array.from(s).reduce((n,c)=>n+(/[\u0000-\u00ff]/.test(c)?size*.5:size),0);}
function wrap(s,max,size){const lines=[];String(s||'').replace(/\r/g,'').split('\n').forEach(p=>{let line='';for(const ch of Array.from(p)){if(width(line+ch,size)>max&&line){lines.push(line);line=ch;}else line+=ch;}lines.push(line);});return lines;}
function buildResume(resume,originalTemplate){
 const {layoutFor,sectionsFor,partitionSections}=require('./layout');
 const {normalizeContent,effectiveDesign}=require('./content-schema');
 const c=normalizeContent(resume.content||{}),template=effectiveDesign(originalTemplate,c),layout=layoutFor(template),frames=[],used=new Set();
 const accent=rgb(template.color),tint=rgb(template.tint||'#edf1ec'),scale=template.fontScale||1;
 const dense=template.density==='compact'||layout.compact,bodySize=(dense?9:10)*scale,leading=template.density==='relaxed'?2:dense?1.65:1.85;
 const left=template.marginInset||44,right=595-left,usable=right-left,bottom=824-left;
 const parts=partitionSections(sectionsFor(c,template),template),columns=parts.side.length?layout.columns:'';
 const sideWidth=Math.round(usable*(columns==='profile'?.35:columns==='panel'?.38:columns==='equal'?.48:columns==='right'?.28:.30));
 const mainX=left+sideWidth+20,mainWidth=usable-sideWidth-20;
 function rect(f,x,top,w,h,color){f.commands.push(color+' rg '+x+' '+(842-top-h)+' '+w+' '+h+' re f');}
 function line(f,x,top,w,color=accent){rect(f,x,top,w,.6,color);}
 function text(f,s,x,top,size,color='0.26 0.30 0.27'){
  s=String(s||'');for(let i=0;i<s.length;i++)used.add(s.charCodeAt(i));
  f.commands.push('BT /F1 '+size+' Tf '+color+' rg 1 0 0 1 '+x+' '+(842-top-size)+' Tm <'+hex(s)+'> Tj ET');
 }
 function border(f,x,top,w,h,color=accent){line(f,x,top,w,color);line(f,x,top+h,w,color);rect(f,x,top,.6,h,color);rect(f,x+w,top,.6,h,color);}
 function frame(index){
  if(frames[index])return frames[index];
  const f={commands:[],top:0,links:[]};frames[index]=f;
  if(layout.frame){border(f,20,20,555,802);border(f,25,25,545,792,'0.88 0.90 0.86');}
  if(layout.edge)rect(f,0,0,18,842,accent);
  if(layout.edgeRight)rect(f,580,0,15,842,accent);
  if(!['minimal','centered','campus','outline','timeline','ledger','boxed','ribbon','horizon','notebook','arch','letter','marker','margin','rail'].includes(template.style))rect(f,0,0,595,dense?3:5,accent);
  if(index){text(f,c.name+' · '+c.role,left,28,10,accent);line(f,left,49,usable,'0.85 0.88 0.83');f.top=65;}
  else{
   let y=left;const header=layout.header,center=header==='center'||header==='arch',nameSize=['editorial','folio'].includes(header)?34:dense?23:27;
   const nameLines=wrap(c.name,usable-(header==='identity'?90:0),nameSize),role='求职意向 · '+c.role+(c.city?' · '+c.city:''),roleLines=wrap(role,usable-12,10);
   const headerHeight=nameLines.length*(nameSize+5)+roleLines.length*15+42;
   if(header==='dark'){
    rect(f,0,0,595,headerHeight,accent);y=29;
    nameLines.forEach(s=>{text(f,s,left,y,nameSize,'1 1 1');y+=nameSize+6;});y+=7;
    roleLines.forEach(s=>{text(f,s,left,y,10,'1 1 1');y+=15;});y=headerHeight+18;
   }else{
    if(header==='bordered')border(f,left-8,y-11,usable+16,headerHeight-12);
    if(header==='ribbon'){rect(f,left,0,17,28,accent);y+=10;}
    if(header==='ledger'||header==='letter')line(f,left,y-11,usable);
    if(['banner','arch','marker'].includes(header)||template.style==='sidebar')rect(f,left-8,y-9,usable+16,headerHeight-12,tint);
    if(header==='marker')rect(f,left-8,y-9,5,headerHeight-12,accent);
    if(header==='catalogue')rect(f,left,y-15,28,4,accent);
    if(header==='identity'){rect(f,right-78,y,78,54,tint);text(f,'个人简历',right-68,y+19,11,accent);}
    if(template.style==='boxed')rect(f,left-5,y-4,Math.min(usable,width(c.name,nameSize)+14),nameSize+13,tint);
    nameLines.forEach(s=>{text(f,s,center?(595-width(s,nameSize))/2:left,y,nameSize,accent);y+=nameSize+8;});
    y+=5;roleLines.forEach(s=>{text(f,s,center?(595-width(s,10))/2:left,y,10,'0.46 0.53 0.47');y+=15;});y+=16;
    if(['editorial','folio','catalogue','letter','timeline','ledger','serif','margin'].includes(template.style)){line(f,left,y-7,usable);y+=4;}
    if(header==='horizon'){rect(f,left,y-5,usable,8,tint);y+=12;}
   }
   const contact=[c.phone,c.email].filter(Boolean).join('  /  ');
   wrap(contact,usable,8.5).forEach(s=>{text(f,s,center?(595-width(s,8.5))/2:left,y,8.5,'0.50 0.55 0.49');y+=14;});f.top=y+9;
  }
  if(['left','profile','panel','equal'].includes(columns))rect(f,left-4,f.top-2,sideWidth+4,bottom-f.top+5,tint);
  else if(columns==='right')rect(f,right-sideWidth-12,f.top,1,bottom-f.top,'0.85 0.89 0.84');
  return f;
 }
 const first=frame(0);
 function stream(sections,baseX,baseWidth,isSide=false){
  let pageIndex=0,f=first,y=f.top,activeBox=null,minEnd=0;
  const marginTitle=layout.heading==='margin',x=baseX+(marginTitle?78:0),w=baseWidth-(marginTitle?78:0);
  const font=isSide?Math.max(7.5,bodySize-1):bodySize;
  function space(height){
   if(y+height<=bottom)return;
   if(activeBox)border(f,baseX-6,activeBox.top,baseWidth+12,bottom-activeBox.top+3,'0.79 0.85 0.76');
   pageIndex++;if(pageIndex>=50)throw new Error('内容过长，请精简到五十页以内。');
   f=frame(pageIndex);y=f.top;minEnd=0;if(activeBox)activeBox={top:y-3};
  }
  function paragraph(value,size=font,color){
   const url=typeof value==='string'&&/^https?:\/\/[^\s]+$/i.test(value.trim())?value.trim():'';
   for(const row of wrap(value,w,size)){
    space(size*leading);text(f,row,x,y,size,color|| (url?'0.25 0.40 0.48':undefined));
    if(url)f.links.push({x,top:y,w:Math.min(w,width(row,size)),h:size*leading,url});
    y+=size*leading;
   }
  }
  function heading(section){
   const h=layout.heading,size=11*scale,label=(h==='number'?section.number+'  ':'')+section.title;
   const titleLines=wrap(label,marginTitle?66:baseWidth,size),height=titleLines.length*size*1.7;
   space(Math.max(57,height+28));y+=dense?8:12;const top=y;
   if(h==='box')activeBox={top:y-5};
   if(['fill','pill','box','tab'].includes(h))rect(f,baseX-4,y-3,baseWidth+8,height+5,tint);
   if(h==='frame')border(f,baseX-4,y-3,baseWidth+8,height+8,'0.77 0.83 0.75');
   if(h==='bar')rect(f,baseX-5,y,3,height,accent);
   if(h==='dot'){rect(f,baseX-6,y+5,4,4,accent);rect(f,baseX-5,y+12,.6,18,'0.79 0.84 0.77');}
   titleLines.forEach(s=>{text(f,s,h==='pill'?baseX+(baseWidth-width(s,size))/2:baseX,y,size,accent);y+=size*1.7;});
   if(marginTitle){minEnd=y+8;y=top;return;}
   y+=5;
   if(['line','rule','split','letter','double'].includes(h))line(f,baseX,y-3,baseWidth,'0.83 0.87 0.81');
   if(h==='double')line(f,baseX,y,baseWidth,'0.83 0.87 0.81');
   if(h==='dash')for(let dx=0;dx<baseWidth;dx+=8)line(f,baseX+dx,y-3,Math.min(4,baseWidth-dx),'0.78 0.84 0.74');
   y+=8;
  }
  for(const section of sections){
   heading(section);if(section.body)paragraph(section.body);
   for(const e of section.entries){
    space(43);paragraph(e.primary,font+1,accent);
    const sub=[e.secondary,e.period].filter(Boolean).join('  ·  ');
    if(isSide||section.key==='links'){
     if(e.secondary)paragraph(e.secondary,Math.max(7.5,font-1),'0.49 0.55 0.48');
     if(e.period)paragraph(e.period,7.5,'0.49 0.55 0.48');
    }else if(sub)paragraph(sub,Math.max(7.5,font-1),'0.49 0.55 0.48');
    if(e.detail)paragraph(e.detail);y+=dense?7:11;
   }
   y=Math.max(y,minEnd);
   if(activeBox){border(f,baseX-6,activeBox.top,baseWidth+12,y-activeBox.top+5,'0.79 0.85 0.76');activeBox=null;y+=5;}
  }
 }
 if(['left','profile','panel','equal'].includes(columns)){stream(parts.side,left+4,sideWidth-12,true);stream(parts.main,mainX,mainWidth);}
 else if(columns==='right'){stream(parts.main,left,usable-sideWidth-25);stream(parts.side,right-sideWidth,sideWidth,true);}
 else{const x=layout.edge?Math.max(left,54):left;stream(parts.main,x,right-x);}
 const pages=frames.map((f,i)=>{text(f,'第 '+(i+1)+' 页',278,807,8,'0.64 0.69 0.61');return f.commands.join('\n');});
 const objects=[],add=s=>{objects.push(s);return objects.length;};add('<< /Type /Catalog /Pages 2 0 R >>');add('');add('<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding 7 0 R /DescendantFonts [4 0 R] /ToUnicode 6 0 R >>');add('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /FontDescriptor 5 0 R /DW 1000 /W [1 95 500] >>');add('<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 /FontBBox [-25 -254 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>');
 const cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
 add('<< /Length '+cmap.length+' >>\nstream\n'+cmap+'\nendstream');
 const codes=Array.from(used).sort((a,b)=>a-b);let encoding='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> def\n/CMapName /Haojianli-GB1 def\n/CMapType 1 def\n/WMode 0 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
 for(let i=0;i<codes.length;i+=100){const chunk=codes.slice(i,i+100);encoding+=chunk.length+' begincidchar\n'+chunk.map(c=>'<'+c.toString(16).padStart(4,'0')+'> '+cid(c)).join('\n')+'\nendcidchar\n';}encoding+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';add('<< /Length '+encoding.length+' >>\nstream\n'+encoding+'\nendstream');
 const kids=[];pages.forEach((content,index)=>{
 const stream=add('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
 const annotations=frames[index].links.map(link=>{
  const uri=Array.from(link.url).map(ch=>ch.charCodeAt(0)>127?encodeURIComponent(ch):ch).join(''),encoded=Array.from(uri).map(ch=>ch.charCodeAt(0).toString(16).padStart(2,'0')).join('');
  return add('<< /Type /Annot /Subtype /Link /Rect ['+link.x+' '+(842-link.top-link.h)+' '+(link.x+link.w)+' '+(842-link.top)+'] /Border [0 0 0] /A << /S /URI /URI <'+encoded+'> >> >>');
 });
 kids.push(add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+stream+' 0 R'+(annotations.length?' /Annots ['+annotations.map(n=>n+' 0 R').join(' ')+']':'')+' >>'));
});objects[1]='<< /Type /Pages /Count '+pages.length+' /Kids ['+kids.map(n=>n+' 0 R').join(' ')+'] >>';
 let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const start=out.length;out+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF\n';return out;
}
let fileSequence=0;
const activeFiles=new Set();
function releaseFile(filePath){activeFiles.delete(filePath);}
function trimExports(fs,dir){
 try{
  const rows=fs.readdirSync(dir).map(name=>({name,match:name.match(/_(\d{13})_(\d+)\.pdf$/)})).filter(row=>row.match&&!/[\\/]/.test(row.name)).sort((a,b)=>Number(b.match[1])-Number(a.match[1])||Number(b.match[2])-Number(a.match[2]));
  let kept=rows.filter(row=>activeFiles.has(dir+'/'+row.name)).length;
  for(const row of rows){const path=dir+'/'+row.name;if(activeFiles.has(path))continue;if(kept++>=20)try{fs.unlinkSync(path);}catch(e){}}
 }catch(e){}
}
async function exportResume(resume,template){
 const text=buildResume(resume,template),bytes=new Uint8Array(text.length);for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i);
 const safeName=Array.from(String(resume.content.name||'我的简历').replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g,'_').trim()).slice(0,32).join('')||'我的简历';
 const fs=wx.getFileSystemManager(),dir=wx.env.USER_DATA_PATH+'/resume_exports';
 try{fs.mkdirSync(dir,true);}catch(e){try{fs.accessSync(dir);}catch(error){throw new Error('无法创建本机导出目录，请检查设备空间后重试。');}}
 const filePath=dir+'/'+safeName+'_简历_'+Date.now()+'_'+(++fileSequence)+'.pdf';
 await new Promise((resolve,reject)=>fs.writeFile({filePath,data:bytes.buffer,success:resolve,fail:()=>reject(new Error('文件写入失败，请检查设备剩余空间。'))}));
 activeFiles.add(filePath);trimExports(fs,dir);return filePath;
}
function pageCount(resume,template){const match=buildResume(resume,template).match(/\/Type \/Pages \/Count (\d+)/);return match?Number(match[1]):1;}
module.exports={buildResume,exportResume,releaseFile,wrap,pageCount};

