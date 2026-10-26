const zlib=require('node:zlib');
function objectsPdf(objects,extra=''){
 let text='%PDF-1.4\n',offsets=[0];for(const [i,body]of objects.entries()){offsets.push(text.length);text+=(i+1)+' 0 obj\n'+body+'\nendobj\n';}
 const xref=text.length;text+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('');
 text+='trailer\n<< /Size '+offsets.length+' /Root 1 0 R '+extra+' >>\nstartxref\n'+xref+'\n%%EOF\n';return new Uint8Array(Buffer.from(text,'latin1'));
}
function fontDocument({blank=false,encrypted=false,pageCount=1}={}){
 const label='本机中文简历解析验证，浙江工商大学，产品运营，项目经历与专业技能。负责用户增长和活动运营，激活率提升百分之二十三，完成三个项目。';
 const hex=Array.from(label,c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
 const content=blank?'':`BT /F1 8 Tf 50 750 Td <${hex}> Tj ET`;
 const compressed=zlib.deflateSync(Buffer.from(content,'ascii')).toString('latin1');
 const objects=[
 '<< /Type /Catalog /Pages 2 0 R >>',`<< /Type /Pages /Count ${pageCount} /Kids [${Array(pageCount).fill('3 0 R').join(' ')}] >>`,
 '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
 `<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n${compressed}\nendstream`,
 '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [6 0 R] >>',
 '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /FontDescriptor 7 0 R /DW 1000 >>',
 '<< /Type /FontDescriptor /FontName /STSong-Light /Flags 6 /FontBBox [-25 -254 1000 880] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>'
 ];
 if(encrypted)objects.push('<< /Filter /Standard /V 1 /R 2 /Length 40 /O <'+'00'.repeat(32)+'> /U <'+'00'.repeat(32)+'> /P -4 >>');
 return {bytes:objectsPdf(objects,encrypted?'/Encrypt 8 0 R /ID [<'+'00'.repeat(16)+'> <'+'00'.repeat(16)+'>]':''),text:label};
}
module.exports={fontDocument};
