// Compatibility names below are scoped by the build banner, never written to WeChat globals.
const streams=require('web-streams-polyfill');
const abort=require('abort-controller/dist/abort-controller.mjs');
__pdfAbortSignal=__pdfAbortSignal||abort.AbortSignal;
__pdfAbortController=__pdfAbortController||abort.AbortController;
__pdfReadableStream=__pdfReadableStream||streams.ReadableStream;
if(!__pdfStructuredClone){const clone=require('@ungap/structured-clone').default;__pdfStructuredClone=(value,options)=>clone(value,options||undefined);}
if(!Promise.withResolvers)Promise.withResolvers=function(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function at(index){const n=Math.trunc(Number(index)||0),length=this.length,k=n<0?length+n:n;return k>=0&&k<length?this[k]:undefined;}
for(const prototype of [Array.prototype,String.prototype,Uint8Array.prototype,Int32Array.prototype])if(!prototype.at)Object.defineProperty(prototype,'at',{value:at,configurable:true,writable:true});
globalThis.pdfjsWorker=require('pdfjs-dist/build/pdf.worker.mjs');
const {getDocument}=require('pdfjs-dist/build/pdf.mjs');
module.exports={getDocument(options){if(!options||!options.data||options.url)throw new Error('只允许读取本机文件数据。');return getDocument(options);},createAbortController:()=>new __pdfAbortController()};
