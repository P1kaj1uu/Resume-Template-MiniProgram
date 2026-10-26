// 规则诊断：只根据用户文本给出建议，不猜测经历，不生成招聘成功率。
function analyze(text,job=''){
 const compact=String(text||'').trim();if(compact.length<50)throw new Error('有效内容不足 50 字，请补充经历后再诊断。');
 const checks=[
 {title:'联系方式',pass:/(1[3-9]\d{9})|([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/.test(compact.replace(/ /g,'')),tip:'补充常用电话或专业邮箱，确保招聘方可以联系到你。'},
 {title:'教育信息',pass:/大学|学院|本科|硕士|博士|大专|教育经历/.test(compact),tip:'写明学校、专业、学历及起止时间；应届生可补充相关课程或奖项。'},
 {title:'经历与贡献',pass:/工作经历|项目经历|实习|负责|主导|参与|开发|设计|运营/.test(compact),tip:'加入工作、实习或项目经历，明确你的角色、行动和结果。'},
 {title:'成果证据',pass:/\d+(?:\.\d+)?\s*(?:%|％|万|人|次|项|个|倍|天|月|元)/.test(compact),tip:'为关键成果补充真实的数据或可核实的交付物；没有数据时，可说明范围、效率或反馈。'},
 {title:'专业技能',pass:/技能|SQL|Python|Java|Excel|Figma|Photoshop|资格|证书|CET|英语/i.test(compact),tip:'列出与目标岗位直接相关的工具、技术、语言或资质，避免泛泛的形容词。'},
 {title:'表达清晰度',pass:compact.length>=200&&compact.length<=5000,tip:compact.length<200?'内容较短，建议补齐重点经历的背景、具体行动与结果。':'内容偏长，建议压缩重复表述，优先保留与目标岗位相关的成果。'}
 ];
 const issues=checks.filter(c=>!c.pass).map(c=>({title:c.title,suggestion:c.tip}));
 if(job.trim()){const words=job.match(/[A-Za-z][A-Za-z+#.]{1,20}|[\u4e00-\u9fa5]{2,6}/g)||[];const missing=[...new Set(words)].filter(w=>!compact.toLowerCase().includes(w.toLowerCase())).slice(0,5);if(missing.length)issues.push({title:'岗位相关性',suggestion:'目标岗位提到了「'+missing.join('、')+'」。请核对是否有对应的真实经历可以补充，切勿直接堆砌关键词。'});}
 return {summary:issues.length?'已检查简历中的联系方式、信息结构与成果表达。建议优先补齐以下内容，再针对目标岗位做取舍。':'基础信息较完整。接下来可重点核对经历的真实性、岗位相关性，以及每段内容是否明确体现你的贡献。',passed:checks.filter(c=>c.pass).length,total:checks.length,issues,strengths:checks.filter(c=>c.pass).map(c=>c.title),source:'规则诊断',note:'仅检查文本线索，不代表招聘评价，也不判断简历文件的视觉排版。'};
}
module.exports={analyze};
