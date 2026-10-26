const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),mini=path.join(root,'miniprogram');let count=0;
function walk(dir,visit){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','artifacts'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,visit);else visit(p);}}
walk(root,p=>{if(p.endsWith('.js')){cp.execFileSync(process.execPath,['--check',p],{stdio:'pipe'});count++;}else if(p.endsWith('.json'))JSON.parse(fs.readFileSync(p,'utf8'));});
const app=JSON.parse(fs.readFileSync(path.join(mini,'app.json'))),packages=app.subPackages||[],routes=[...app.pages,...packages.flatMap(s=>s.pages.map(p=>s.root+'/'+p))];
function checkFiles(p){for(const ext of ['js','json','wxml','wxss'])if(!fs.existsSync(p+'.'+ext))throw Error('缺少页面或组件文件：'+p+'.'+ext);}
for(const p of routes)checkFiles(path.join(mini,p));
let components=0;walk(mini,p=>{if(!p.endsWith('.json'))return;const config=JSON.parse(fs.readFileSync(p,'utf8'));if(config.component){checkFiles(p.slice(0,-5));components++;}for(const ref of Object.values(config.usingComponents||{})){if(/^(plugin|weui):/.test(ref))continue;checkFiles(ref.startsWith('/')?path.join(mini,ref):path.resolve(path.dirname(p),ref));}});
// This guards source size; confirm the actual uploaded package separately in DevTools.
const sizes={主包:0};for(const pkg of packages)sizes[pkg.root]=0;
walk(mini,p=>{const rel=path.relative(mini,p).replaceAll(path.sep,'/'),pkg=packages.find(s=>rel.startsWith(s.root+'/'));sizes[pkg?pkg.root:'主包']+=fs.statSync(p).size;});
for(const [name,bytes] of Object.entries(sizes))if(bytes>2*1024*1024)throw Error(name+'源码超过二兆：'+bytes+' 字节');
console.log('Checked '+count+' JavaScript files, JSON configuration, '+routes.length+' routes and '+components+' shared components.');
console.log('资源源码字节：'+JSON.stringify(sizes));
