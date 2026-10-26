function byteLength(text){let bytes=0;for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);if(code<128)bytes++;else if(code<2048)bytes+=2;else if(code>=0xd800&&code<=0xdbff&&i+1<text.length&&text.charCodeAt(i+1)>=0xdc00&&text.charCodeAt(i+1)<=0xdfff){bytes+=4;i++;}else bytes+=3;}return bytes;}
function jsonBytes(value){return byteLength(JSON.stringify(value));}
function read(key,fallback){try{const value=wx.getStorageSync(key);return value===''||value===undefined||value===null?fallback:value;}catch(e){throw new Error('本机资料暂时无法读取，请重新打开后再试。');}}
function write(key,value){if(jsonBytes(value)>950*1024)throw new Error(key==='resumes_v1'?'本机简历存储已接近上限，请先导出并删除不需要的简历后重试。':'本机记录过大，请先清理较早的版本后重试。');try{wx.setStorageSync(key,value);}catch(e){throw new Error('本机保存失败，请检查设备空间后重试。');}}
module.exports={byteLength,jsonBytes,read,write};
