const {sample}=require('../.build/miniprogram/utils/data');
const {normalizeContent}=require('../.build/miniprogram/utils/content-schema');
function detailed(){
 const c=normalizeContent(JSON.parse(JSON.stringify(sample)));
 c.internships=[{id:'intern1',company:'实习单位示例',position:'运营实习生',period:'2023.07 — 2023.09',detail:'独立整理用户反馈，协助完成活动执行与复盘。'}];
 c.certificates=[{id:'cert1',name:'数据分析职业证书',issuer:'示例培训机构',period:'2025.05',detail:'完成数据分析方法与实践考核。'}];
 c.awards=[{id:'award1',name:'校级实践成果奖',issuer:'浙江工商大学',period:'2024.05',detail:'获奖作品围绕社区调研展开。'}];
 c.languages=[{id:'lang1',name:'英语',level:'大学英语六级',detail:'可进行日常工作沟通与资料阅读。'}];
 c.links=[{id:'link1',name:'个人作品集',url:'https://example.com/portfolio?view=full%20name',detail:'展示项目复盘与个人作品。'}];
 c.customSections=[{id:'custom1',title:'志愿服务',detail:'参与社区教育志愿服务，负责活动设计与现场组织。'}];
 return c;
}
module.exports={detailed};

