const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function mount(file,kind='Page',overrides={}){
 let definition;const full=path.resolve(__dirname,'../miniprogram',file);
 const context={wx:global.wx,setTimeout,clearTimeout,console,getCurrentPages:()=>global.testPages||[],require:p=>require(path.resolve(path.dirname(full),p)),[kind]:value=>definition=value,...overrides};
 vm.runInNewContext(fs.readFileSync(full,'utf8'),context);
 const properties=Object.fromEntries(Object.entries(definition.properties||{}).map(([key,prop])=>[key,prop.value]));
 const instance={...definition,...definition.methods,data:JSON.parse(JSON.stringify({...properties,...definition.data})),patches:[],getTabBar:()=>({setData(){}}),setData(patch){this.patches.push(Object.keys(patch));for(const [key,value]of Object.entries(patch)){const parts=key.replace(/\[(\d+)\]/g,'.$1').split('.');let target=this.data;for(const part of parts.slice(0,-1))target=target[part];target[parts.at(-1)]=value;}}};
 return instance;
}
module.exports={mount};
