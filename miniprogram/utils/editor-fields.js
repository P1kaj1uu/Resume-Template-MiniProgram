const sectionDefs=[
 {key:'education',title:'教育经历',hint:'学校、专业和真实的学习成果',tab:1,fields:[{key:'school',label:'学校',placeholder:'填写学校名称'},{key:'major',label:'专业与学历',placeholder:'例如：市场营销 · 本科'},{key:'period',label:'起止时间',placeholder:'2020.09 — 2024.06'},{key:'detail',label:'补充说明',placeholder:'成绩、奖项、核心课程等',multiline:true}]},
 {key:'experience',title:'工作经历',hint:'写清楚做了什么，以及带来了什么',tab:1,fields:[{key:'company',label:'公司名称',placeholder:'填写公司全称'},{key:'position',label:'职位',placeholder:'例如：产品运营'},{key:'period',label:'起止时间',placeholder:'2024.07 — 至今'},{key:'detail',label:'工作内容与成果',placeholder:'用行动、范围和真实结果介绍自己的贡献。',multiline:true}]},
 {key:'internships',title:'实习经历',hint:'实习中具体承担的工作，同样值得写清楚',tab:1,fields:[{key:'company',label:'实习单位',placeholder:'填写单位名称'},{key:'position',label:'实习岗位',placeholder:'填写实习岗位'},{key:'period',label:'起止时间',placeholder:'2024.03 — 2024.06'},{key:'detail',label:'实习内容与成果',placeholder:'参与了哪些工作？独立完成了什么？',multiline:true}]},
 {key:'projects',title:'项目经历',hint:'项目背景、你的行动，以及最终结果',tab:1,fields:[{key:'name',label:'项目名称',placeholder:'填写项目名称'},{key:'role',label:'承担角色',placeholder:'例如：项目负责人'},{key:'period',label:'起止时间',placeholder:'2025.03 — 2025.06'},{key:'detail',label:'项目介绍与个人贡献',placeholder:'写清目标、个人贡献和可核实的成果。',multiline:true}]},
 {key:'certificates',title:'资格证书',hint:'优先填写与目标岗位相关的证书',tab:2,fields:[{key:'name',label:'证书名称',placeholder:'填写证书或职业资格名称'},{key:'issuer',label:'颁发单位',placeholder:'填写颁发单位，可留空'},{key:'period',label:'取得时间',placeholder:'例如：2025.06'},{key:'detail',label:'补充说明',placeholder:'等级、方向或有效期等，可留空',multiline:true}]},
 {key:'awards',title:'荣誉奖项',hint:'写明奖项、评选范围和你的贡献',tab:2,fields:[{key:'name',label:'奖项名称',placeholder:'填写奖项名称'},{key:'issuer',label:'颁发单位',placeholder:'填写学校、主办方或机构'},{key:'period',label:'获奖时间',placeholder:'例如：2025.06'},{key:'detail',label:'补充说明',placeholder:'奖项级别、评选范围等，可留空',multiline:true}]},
 {key:'languages',title:'语言能力',hint:'用考试成绩或实际使用能力说明',tab:2,fields:[{key:'name',label:'语言',placeholder:'例如：英语、日语'},{key:'level',label:'水平与资质',placeholder:'例如：大学英语六级、商务沟通熟练'},{key:'detail',label:'补充说明',placeholder:'实际使用场景或证书成绩，可留空',multiline:true}]},
 {key:'links',title:'作品与链接',hint:'留一个可以打开的作品集或项目地址',tab:2,fields:[{key:'name',label:'作品或网站名称',placeholder:'例如：个人作品集'},{key:'url',label:'完整网址',placeholder:'填写包含协议头的完整网址'},{key:'detail',label:'补充说明',placeholder:'链接中的作品内容和你的参与部分',multiline:true}]},
 {key:'customSections',title:'自定义栏目',hint:'补充志愿活动、校园实践、研究成果等',tab:2,fields:[{key:'title',label:'栏目名称',placeholder:'例如：志愿活动、研究成果'},{key:'detail',label:'栏目内容',placeholder:'写下与求职相关、可以核实的内容。',multiline:true}]}
];
const preferenceOptions={
 fontSize:[{value:'small',name:'小一号'},{value:'normal',name:'标准'},{value:'large',name:'大一号'}],
 spacing:[{value:'template',name:'跟随模板'},{value:'compact',name:'紧凑'},{value:'standard',name:'适中'},{value:'relaxed',name:'舒展'}],
 margin:[{value:'template',name:'跟随模板'},{value:'narrow',name:'较少留白'},{value:'standard',name:'适中留白'},{value:'wide',name:'宽松留白'}]
};
module.exports={sectionDefs,preferenceOptions};

