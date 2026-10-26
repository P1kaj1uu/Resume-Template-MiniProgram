// A single local outline set. Masks inherit their color from the surrounding UI.
const paths={
 'arrow-left':'<path d="M19 12H5m6-6-6 6 6 6"/>',
 'arrow-right':'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
 'arrow-up':'<path d="M12 19V5m-6 6 6-6 6 6"/>',
 'arrow-down':'<path d="M12 5v14m-6-6 6 6 6-6"/>',
 'chevron-right':'<path d="m9 5 7 7-7 7"/>',
 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
 'chevron-up':'<path d="m6 15 6-6 6 6"/>',
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8m-8 4h5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 more:'<circle cx="5" cy="12" r="1" fill="#000"/><circle cx="12" cy="12" r="1" fill="#000"/><circle cx="19" cy="12" r="1" fill="#000"/>',
 heart:'<path d="M20.5 4.8a5.3 5.3 0 0 0-7.5 0L12 5.9l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.6-8.7a5.3 5.3 0 0 0-.1-7.5Z"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
 save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"/><path d="M7 3v6h9V3M7 21v-8h10v8"/>',
 scan:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M7 9h10M7 13h10m-10 4h6"/>',
 folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 9h18"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1.1.8-2 1.1-2 2.5m0 3h.01"/>',
 pencil:'<path d="m15 4 5 5M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15z"/>',
 layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M9 8v13"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>'
};
const fillShapes={home:'<path d="m3 10 9-7 9 7v10H3Z"/>',grid:'<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>',file:'<path d="M4 3h10l6 6v12H4Z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/>'};
function svg(name,filled=false,weight=1.8){
 const body=paths[name]||paths.file,w=Math.max(1,Math.min(2.5,Number(weight)||1.8));
 const fill=filled&&fillShapes[name]?'<g fill="#000" opacity=".16">'+fillShapes[name]+'</g>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'+fill+'<g fill="'+(filled&&name==='heart'?'#000':'none')+'" stroke="#000" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round">'+body+'</g></svg>';
}
function base64(value){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let out='';for(let i=0;i<value.length;i+=3){const a=value.charCodeAt(i),b=value.charCodeAt(i+1),c=value.charCodeAt(i+2),n=(a<<16)|((b||0)<<8)|(c||0);out+=chars[(n>>>18)&63]+chars[(n>>>12)&63]+(i+1<value.length?chars[(n>>>6)&63]:'=')+(i+2<value.length?chars[n&63]:'=');}return out;}
module.exports={svg,names:Object.keys(paths),source:(name,filled,weight)=>'data:image/svg+xml;base64,'+base64(svg(name,filled,weight))};
