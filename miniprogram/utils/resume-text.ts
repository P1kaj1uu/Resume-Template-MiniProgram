import type { ContentInput } from '../types/resume';
import { findTemplate } from './catalog';
import { normalizeContent } from './content-schema';
import { sectionsFor } from './layout';
function resumeText(resume: { content: ContentInput; templateId?: string }) {
  const c = normalizeContent(resume.content || {}),
    lines = [c.name, c.role, c.phone, c.email, c.city];
  for (const section of sectionsFor(c, findTemplate(resume.templateId))) {
    lines.push(section.title, section.body);
    for (const e of section.entries) lines.push(e.primary, e.secondary, e.period, e.detail);
  }
  return lines.filter((v) => typeof v === 'string' && v.trim()).join('\n');
}
export { resumeText };
