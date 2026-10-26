import type { ContentInput, EntryKey, Resume, ResumeInput, ResumeVersion } from '../types/resume';
import { findTemplate, templates } from './catalog';
import { entryFields, meaningful, normalizeContent } from './content-schema';
import local = require('./storage');
const sample = {
  name: '林知夏',
  role: '产品运营',
  phone: '138 0000 2026',
  email: 'zhixia.lin@example.com',
  city: '杭州',
  summary: '关注用户需求与产品体验，擅长以数据分析发现问题，推动跨团队协作与项目落地。',
  education: [
    {
      id: 'edu0',
      school: '浙江工商大学',
      major: '市场营销 · 本科',
      period: '2020.09 — 2024.06',
      detail: '专业成绩 3.8 / 4.0，校级优秀毕业生',
    },
  ],
  experience: [
    {
      id: 'exp0',
      company: '某互联网科技有限公司',
      position: '产品运营',
      period: '2024.07 — 至今',
      detail:
        '负责用户增长与内容运营，通过用户分层和活动策略优化，提升新用户激活率 23%。\n协同产品与设计团队推进 3 个功能迭代，建立用户反馈闭环。',
    },
  ],
  projects: [
    {
      id: 'pro0',
      name: '新用户成长计划',
      role: '项目负责人',
      period: '2025.03 — 2025.06',
      detail: '梳理关键转化路径，搭建运营数据看板，通过对照测试持续改进新手引导体验。',
    },
  ],
  skills: '数据分析 / 表格处理 / 用户研究 / 项目管理',
};
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
function blank() {
  return normalizeContent({});
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function normalize(resume: ResumeInput): Resume {
  return {
    ...resume,
    title: typeof resume.title === 'string' ? resume.title : '我的求职简历',
    templateId: findTemplate(resume.templateId).id,
    createdAt: Number.isFinite(resume.createdAt) ? resume.createdAt : 0,
    updatedAt: Number.isFinite(resume.updatedAt) ? resume.updatedAt! : 0,
    content: normalizeContent(resume.content || {}),
  };
}
function all() {
  const rows = local.read<Resume[]>('resumes_v1', []);
  if (!Array.isArray(rows)) throw new Error('本机简历记录格式异常，请保留当前数据并联系维护人员。');
  return rows.filter((r) => r && typeof r.id === 'string' && r.id).map(normalize);
}
function get(id: string) {
  return all().find((r) => r.id === id);
}
function save(resume: ResumeInput) {
  const rows = all(),
    r = normalize({ ...resume, updatedAt: Date.now() }),
    index = rows.findIndex((x) => x.id === r.id);
  if (index < 0) rows.unshift(r);
  else rows[index] = r;
  local.write('resumes_v1', rows);
  return r;
}
function create(templateId = 'classic', fromSample = false) {
  return save({
    id: uid(),
    title: '我的求职简历',
    templateId: findTemplate(templateId).id,
    content: fromSample ? clone(sample) : blank(),
    createdAt: Date.now(),
  });
}
function versionMap(): Record<string, ResumeVersion[]> {
  const map = local.read<Record<string, ResumeVersion[]>>('resume_versions_v1', {});
  if (typeof map !== 'object' || Array.isArray(map))
    throw new Error('本机版本记录格式异常，请保留当前数据并联系维护人员。');
  return Object.assign(Object.create(null), map);
}
function versions(id: string): ResumeVersion[] {
  const rows = versionMap()[id];
  return Array.isArray(rows)
    ? rows.filter(
        (v) => v && typeof v.id === 'string' && v.snapshot && typeof v.snapshot === 'object',
      )
    : [];
}
function writeVersions(map: Record<string, ResumeVersion[]>, keepId?: string) {
  let entries = Object.entries(map)
    .flatMap(([id, rows]) => (Array.isArray(rows) ? rows : []).map((row) => ({ id, row })))
    .sort(
      (a, b) =>
        b.row.savedAt - a.row.savedAt || (a.row.id === keepId ? -1 : b.row.id === keepId ? 1 : 0),
    );
  entries = entries.slice(0, 40);
  let next: Record<string, ResumeVersion[]> = Object.create(null);
  for (const { id, row } of entries) (next[id] || (next[id] = [])).push(row);
  while (local.jsonBytes(next) > 800 * 1024 && entries.length) {
    entries.pop();
    next = Object.create(null);
    for (const { id, row } of entries) (next[id] || (next[id] = [])).push(row);
  }
  local.write('resume_versions_v1', next);
}
function checkpoint(id: string, label = '手动保存') {
  const resume = get(id);
  if (!resume) throw new Error('这份简历已不存在。');
  const map = versionMap(),
    record = { id: uid(), label: label.slice(0, 30), savedAt: Date.now(), snapshot: clone(resume) };
  if (local.jsonBytes(record) > 750 * 1024) throw new Error('这份简历内容过长，请先导出留存。');
  map[id] = [record, ...versions(id)].slice(0, 5);
  writeVersions(map, record.id);
  return record;
}
function restoreVersion(id: string, versionId: string) {
  const current = get(id),
    version = versions(id).find((v) => v.id === versionId);
  if (!current || !version) throw new Error('这份简历或版本记录已不存在。');
  const snapshot = clone(version.snapshot);
  checkpoint(id, '恢复版本前的内容');
  return save({ ...snapshot, id: current.id, createdAt: current.createdAt });
}
function clearVersions(id: string) {
  const map = versionMap();
  delete map[id];
  writeVersions(map);
}
function remove(id: string) {
  const before = all(),
    history = versionMap(),
    after = Object.assign(Object.create(null), history);
  delete after[id];
  local.write(
    'resumes_v1',
    before.filter((r) => r.id !== id),
  );
  try {
    local.write('resume_versions_v1', after);
  } catch (e) {
    try {
      wx.setStorageSync('resumes_v1', before);
    } catch (rollback) {
      throw new Error('删除未完成，设备存储暂不可写，请重新打开简历列表核对。');
    }
    throw e;
  }
}
function duplicate(id: string) {
  const r = get(id);
  if (!r) return;
  return save({ ...clone(r), id: uid(), title: r.title + '（副本）', createdAt: Date.now() });
}
function completion(input: ContentInput) {
  const c = normalizeContent(input),
    filled = (key: EntryKey) => c[key].some((e) => meaningful(e, entryFields[key]));
  const fields = [
    c.name.trim(),
    c.role.trim(),
    c.phone.trim() || c.email.trim(),
    filled('education'),
    filled('experience') || filled('internships') || filled('projects'),
    c.skills.trim(),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
function date(time: number) {
  if (!Number.isFinite(time) || time <= 0) return '未记录日期';
  const d = new Date(time);
  return d.getMonth() + 1 + '月' + d.getDate() + '日';
}
function dateTime(time: number) {
  if (!Number.isFinite(time) || time <= 0) return '未记录日期';
  const d = new Date(time);
  return (
    date(time) +
    ' ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}
function decorate(r: Resume) {
  return {
    ...r,
    template: findTemplate(r.templateId),
    progress: completion(r.content),
    date: date(r.updatedAt),
  };
}
function favorites() {
  const ids = local.read<string[]>('favorite_templates_v1', []);
  return Array.isArray(ids) ? ids.filter((id) => templates.some((t) => t.id === id)) : [];
}
function toggleFavorite(id: string) {
  if (!templates.some((t) => t.id === id)) return favorites();
  const ids = favorites(),
    next = ids.includes(id) ? ids.filter((x) => x !== id) : ids.concat(id);
  local.write('favorite_templates_v1', next);
  return next;
}
function changeTemplate(id: string, templateId: string) {
  const r = get(id);
  if (!r) throw new Error('这份简历已不存在，请重新选择。');
  if (!templates.some((t) => t.id === templateId)) throw new Error('模板不存在。');
  if (r.templateId !== templateId) checkpoint(id, '更换模板前');
  return save({ ...r, templateId });
}
export {
  all,
  blank,
  changeTemplate,
  checkpoint,
  clearVersions,
  completion,
  create,
  dateTime,
  decorate,
  duplicate,
  favorites,
  get,
  normalize,
  remove,
  restoreVersion,
  sample,
  save,
  templates,
  toggleFavorite,
  uid,
  versions,
};
