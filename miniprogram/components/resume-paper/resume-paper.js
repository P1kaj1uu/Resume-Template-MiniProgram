const {sample}=require('../../utils/data');
const {layoutFor,sectionsFor,partitionSections}=require('../../utils/layout');
const {effectiveDesign}=require('../../utils/content-schema');
Component({
 properties:{content:{type:Object,value:sample},design:{type:Object,value:{}},theme:{type:String,value:'classic'},color:{type:String,value:'#315d4d'},thumbnail:{type:Boolean,value:false}},
 data:{layout:{},sections:[],side:[],main:[],resolved:{},thumbMain:[],thumbSide:[]},
 observers:{'content,design,theme,color,thumbnail':function(content,design,theme,color){
  const base=Object.assign({style:theme,color,tint:'#e8eee8',density:'standard'},design||{});
  const resolved=effectiveDesign(base,content||sample),sections=sectionsFor(content||sample,resolved),parts=partitionSections(sections,resolved);
  const thumb=rows=>rows.map(s=>({key:s.key,title:s.title,number:s.number,preview:s.entries.length?s.entries[0].primary:s.body.slice(0,34)}));
  this.setData({resolved,layout:Object.assign({},layoutFor(resolved),parts.side.length?{}:{columns:''}),sections,side:parts.side,main:parts.main,thumbMain:thumb(parts.main),thumbSide:thumb(parts.side)});
 }}
});
