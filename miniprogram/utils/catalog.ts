import type { Template } from '../types/resume';
interface FilterOptions {
  query?: string;
  favorites?: string[];
  category?: string;
  group?: string;
  access?: string;
}
const palettes = [
  { id: 'sage', name: '松绿', color: '#315d4d', tint: '#e8eee8' },
  { id: 'navy', name: '靛蓝', color: '#3b536d', tint: '#e9edf2' },
  { id: 'clay', name: '陶棕', color: '#946650', tint: '#f2eae3' },
  { id: 'ink', name: '墨灰', color: '#444b4c', tint: '#ebedeb' },
  { id: 'gold', name: '麦金', color: '#8b7846', tint: '#f1eee2' },
  { id: 'teal', name: '青碧', color: '#3e7273', tint: '#e5eeee' },
  { id: 'plum', name: '梅紫', color: '#76566c', tint: '#efe8ed' },
  { id: 'stone', name: '岩褐', color: '#786c59', tint: '#f1eee7' },
  { id: 'forest', name: '杉青', color: '#416656', tint: '#e7eee7' },
  { id: 'rust', name: '朱砂', color: '#a36049', tint: '#f4e9e1' },
];
const families = [
  {
    id: 'classic',
    name: '留白',
    style: 'classic',
    group: '简约',
    category: '通用',
    tags: ['清晰层次', '单栏排版'],
    caption: '留出阅读的余地，让经历成为重点。',
  },
  {
    id: 'campus',
    name: '青禾',
    style: 'campus',
    group: '校园',
    category: '应届生',
    tags: ['教育优先', '校园求职'],
    caption: '把课程、实践与第一份经验整理清楚。',
  },
  {
    id: 'business',
    name: '序章',
    style: 'business',
    group: '商务',
    category: '职场人',
    tags: ['深色页眉', '职业稳重'],
    caption: '醒目的姓名栏，适合有积累的职业经历。',
  },
  {
    id: 'minimal',
    name: '素笺',
    style: 'minimal',
    group: '简约',
    category: '通用',
    tags: ['居中抬头', '纯粹文字'],
    caption: '收起装饰，专注介绍你做过的事。',
  },
  {
    id: 'creative',
    name: '拾色',
    style: 'creative',
    group: '创意',
    category: '设计岗',
    tags: ['侧边色带', '创意表达'],
    caption: '有一点个性，也保持清楚的阅读顺序。',
  },
  {
    id: 'tech',
    name: '理序',
    style: 'tech',
    group: '简约',
    category: '技术岗',
    tags: ['项目优先', '技能清楚'],
    caption: '先呈现做过的项目，再展开技术与经历。',
  },
  {
    id: 'editorial',
    name: '行间',
    style: 'editorial',
    group: '创意',
    category: '产品运营',
    tags: ['杂志排版', '衬线标题'],
    caption: '用大标题与编号，梳理每一段重要经历。',
  },
  {
    id: 'outline',
    name: '清序',
    style: 'outline',
    group: '商务',
    category: '财务行政',
    tags: ['细框页眉', '严谨有序'],
    caption: '克制的边框，适合清晰、准确的职业表达。',
  },
  {
    id: 'sidebar',
    name: '侧影',
    style: 'sidebar',
    group: '双栏',
    category: '职场人',
    tags: ['左侧信息栏', '双栏结构'],
    caption: '优势与学历放在侧栏，工作成果留在主栏。',
  },
  {
    id: 'split',
    name: '并行',
    style: 'split',
    group: '双栏',
    category: '市场销售',
    tags: ['右侧信息栏', '重点突出'],
    caption: '从主栏了解经历，在侧栏补充能力与背景。',
  },
  {
    id: 'timeline',
    name: '年轮',
    style: 'timeline',
    group: '简约',
    category: '转行求职',
    tags: ['时间线条', '成长脉络'],
    caption: '沿着时间线，让每一步积累自然展开。',
  },
  {
    id: 'boxed',
    name: '方寸',
    style: 'boxed',
    group: '商务',
    category: '财务行政',
    tags: ['分区边框', '条理清楚'],
    caption: '用规整的分区，让信息各有位置。',
  },
  {
    id: 'framed',
    name: '尺素',
    style: 'framed',
    group: '简约',
    category: '教育科研',
    tags: ['整页细框', '沉静留白'],
    caption: '适度的留白与边界，呈现踏实的专业积累。',
  },
  {
    id: 'centered',
    name: '正中',
    style: 'centered',
    group: '简约',
    category: '医疗健康',
    tags: ['中轴排版', '柔和分隔'],
    caption: '稳定的中轴与轻巧的标题，阅读更从容。',
  },
  {
    id: 'ribbon',
    name: '书签',
    style: 'ribbon',
    group: '校园',
    category: '应届生',
    tags: ['书签页眉', '轻盈清爽'],
    caption: '把校园经历与实践成果，放在同一张纸上。',
  },
  {
    id: 'serif',
    name: '书卷',
    style: 'serif',
    group: '商务',
    category: '教育科研',
    tags: ['宋体风格', '学术气质'],
    caption: '以朴素的文字层次，介绍研究与教学经验。',
  },
  {
    id: 'compact',
    name: '精简',
    style: 'compact',
    group: '简约',
    category: '技术岗',
    tags: ['紧凑间距', '信息密集'],
    caption: '在有限篇幅里，保留更有分量的细节。',
  },
  {
    id: 'mosaic',
    name: '拼章',
    style: 'mosaic',
    group: '双栏',
    category: '设计岗',
    tags: ['均衡双栏', '模块组织'],
    caption: '双栏各有重点，经历与能力同时展开。',
  },
  {
    id: 'profile',
    name: '名片',
    style: 'profile',
    group: '双栏',
    category: '市场销售',
    tags: ['个人名片', '宽侧栏'],
    caption: '先认识你，再看见你带来的实际成果。',
  },
  {
    id: 'ledger',
    name: '简报',
    style: 'ledger',
    group: '商务',
    category: '产品运营',
    tags: ['细线分隔', '成果导向'],
    caption: '像一份简洁的工作简报，让成果容易找到。',
  },
  {
    id: 'folio',
    name: '大页',
    style: 'folio',
    group: '创意',
    category: '通用',
    tags: ['大字页眉', '清楚易读'],
    caption: '以大字抬头和编号栏目，组织一页完整的经历。',
  },
  {
    id: 'banner',
    name: '岩青',
    style: 'banner',
    group: '商务',
    category: '职场人',
    tags: ['浅色通栏', '清楚易读'],
    caption: '浅色横幅收住个人信息，正文保持简洁。',
  },
  {
    id: 'rail',
    name: '纵横',
    style: 'rail',
    group: '简约',
    category: '技术岗',
    tags: ['右侧竖线', '清楚易读'],
    caption: '用一条侧边细线，收拢项目与技能的重点。',
  },
  {
    id: 'catalogue',
    name: '篇目',
    style: 'catalogue',
    group: '商务',
    category: '教育科研',
    tags: ['目录编号', '清楚易读'],
    caption: '像目录一样梳理研究、教学与个人成果。',
  },
  {
    id: 'duotone',
    name: '双线',
    style: 'duotone',
    group: '商务',
    category: '财务行政',
    tags: ['双线标题', '清楚易读'],
    caption: '双线分隔与细框抬头，适合严谨的职业表达。',
  },
  {
    id: 'horizon',
    name: '平川',
    style: 'horizon',
    group: '简约',
    category: '产品运营',
    tags: ['横带页眉', '清楚易读'],
    caption: '横向色带承接抬头，内容沿清晰的层次展开。',
  },
  {
    id: 'notebook',
    name: '手记',
    style: 'notebook',
    group: '校园',
    category: '应届生',
    tags: ['虚线分区', '清楚易读'],
    caption: '轻巧的虚线分区，整理实践和课堂之外的积累。',
  },
  {
    id: 'arch',
    name: '月拱',
    style: 'arch',
    group: '创意',
    category: '设计岗',
    tags: ['圆拱页眉', '清楚易读'],
    caption: '柔和的圆拱页眉，搭配居中的栏目标题。',
  },
  {
    id: 'panel',
    name: '叠页',
    style: 'panel',
    group: '双栏',
    category: '市场销售',
    tags: ['深色抬头双栏', '清楚易读'],
    caption: '深色抬头配宽侧栏，经历与能力各有空间。',
  },
  {
    id: 'letter',
    name: '信笺',
    style: 'letter',
    group: '简约',
    category: '转行求职',
    tags: ['信笺抬头', '清楚易读'],
    caption: '用朴素的信笺结构，讲清职业积累与转向。',
  },
  {
    id: 'marker',
    name: '页角',
    style: 'marker',
    group: '校园',
    category: '应届生',
    tags: ['页角色签', '清楚易读'],
    caption: '页角色签和教育优先的顺序，适合校园求职。',
  },
  {
    id: 'margin',
    name: '边注',
    style: 'margin',
    group: '商务',
    category: '医疗健康',
    tags: ['边注式标题', '清楚易读'],
    caption: '栏目标题留在左侧，正文在右侧连贯展开。',
  },
];
const categories = [
  '全部',
  '通用',
  '应届生',
  '职场人',
  '技术岗',
  '设计岗',
  '产品运营',
  '市场销售',
  '教育科研',
  '财务行政',
  '医疗健康',
  '转行求职',
];
// 每种版式提供十套配色与疏密方案。交错排列，首屏直接展示不同结构。
const templates: Template[] = [];
palettes.forEach((palette, variant) =>
  families.forEach((family, familyIndex) => {
    const free =
      (variant < 4 || variant === 6 || variant === 7) &&
      !(variant === 0 && ['business', 'creative', 'tech'].includes(family.id));
    templates.push({
      ...family,
      id: variant === 0 ? family.id : family.id + '-' + palette.id,
      familyId: family.id,
      isNew: familyIndex >= 20 || variant >= 6,
      familyName: family.name,
      name: family.name + '·' + palette.name,
      color: palette.color,
      tint: palette.tint,
      palette: palette.name,
      density:
        family.id === 'compact' ? 'compact' : ['standard', 'compact', 'relaxed'][variant % 3],
      densityName:
        family.id === 'compact' || variant % 3 === 1 ? '紧凑' : variant % 3 === 2 ? '舒展' : '适中',
      free,
      rank: variant * families.length + familyIndex,
      categories: [family.category],
      tags: [family.tags[0], family.group + '排版', palette.name],
    });
  }),
);
function findTemplate(id?: string) {
  return templates.find((t) => t.id === id) || templates[0];
}
function filterTemplates(options: FilterOptions = {}) {
  const q = String(options.query || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  const favorites = options.favorites || [];
  return templates
    .filter((t) => {
      if (
        options.category &&
        options.category !== '全部' &&
        !t.categories.includes(options.category)
      )
        return false;
      if (options.group && options.group !== '全部版式' && t.group !== options.group) return false;
      if (options.access === '免费' && !t.free) return false;
      if (options.access === '新增' && !t.isNew) return false;
      if (options.access === '收藏' && !favorites.includes(t.id)) return false;
      return (
        !q ||
        [t.name, t.caption, t.category, t.group, t.palette, t.densityName, ...t.tags]
          .join('')
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(q)
      );
    })
    .map((t) => ({ ...t, favorite: favorites.includes(t.id) }));
}
export { categories, families, filterTemplates, findTemplate, palettes, templates };
