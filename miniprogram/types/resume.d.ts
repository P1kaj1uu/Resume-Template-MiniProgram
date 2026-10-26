/** Persistent field names and formats remain compatible with resumes_v1. */
export type EntryKey =
  | 'education'
  | 'experience'
  | 'internships'
  | 'projects'
  | 'certificates'
  | 'awards'
  | 'languages'
  | 'links'
  | 'customSections';
export type TextKey = 'name' | 'role' | 'phone' | 'email' | 'city' | 'summary' | 'skills';
export type Entry = { id: string; [field: string]: string };
export interface Preferences {
  fontSize: 'small' | 'normal' | 'large';
  spacing: 'template' | 'compact' | 'standard' | 'relaxed';
  margin: 'template' | 'narrow' | 'standard' | 'wide';
}
export type ResumeContent = Record<TextKey, string> &
  Record<EntryKey, Entry[]> & {
    preferences: Preferences;
    sectionOrder: string[];
    hiddenSections: string[];
  };
export type ContentInput = Partial<Omit<ResumeContent, 'preferences'>> & {
  preferences?: Partial<Preferences>;
};
export interface Resume {
  id: string;
  title: string;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  content: ResumeContent;
}
export type ResumeInput = Omit<Resume, 'updatedAt' | 'content'> & {
  updatedAt?: number;
  content: ContentInput;
};
export interface ResumeVersion {
  id: string;
  label: string;
  savedAt: number;
  snapshot: Resume;
}
export interface Template {
  id: string;
  name: string;
  style: string;
  group: string;
  category: string;
  tags: string[];
  caption: string;
  familyId: string;
  familyName: string;
  isNew: boolean;
  color: string;
  tint: string;
  palette: string;
  density: string;
  densityName: string;
  free: boolean;
  rank: number;
  categories: string[];
  favorite?: boolean;
}
export type DesignInput = Pick<Template, 'style' | 'color' | 'density'> & Partial<Template>;
export type Design = DesignInput & {
  fontScale: number;
  bodySize: number;
  entrySize: number;
  secondarySize: number;
  headingSize: number;
  paperPadding: number;
  headerBleed: number;
  marginInset: number;
};
export interface Layout {
  header: string;
  heading: string;
  educationFirst?: boolean;
  projectsFirst?: boolean;
  serif?: boolean;
  edge?: boolean;
  edgeRight?: boolean;
  frame?: boolean;
  compact?: boolean;
  columns?: string;
}
export interface SectionEntry {
  id: string;
  primary: string;
  secondary: string;
  period: string;
  detail: string;
}
export interface Section {
  key: string;
  title: string;
  body: string;
  entries: SectionEntry[];
  number?: string;
}
export interface SectionRow {
  key: string;
  title: string;
  hidden: boolean;
}
export interface ReviewIssue {
  title: string;
  path: string;
  tab: number;
}
export interface AnalysisReport {
  summary: string;
  passed: number;
  total: number;
  issues: { title: string; suggestion: string }[];
  strengths: string[];
  source: string;
  note: string;
}
export interface OperationError extends Error {
  detail?: string;
  kind?: 'missing' | 'delivery';
  local?: boolean;
  errMsg?: string;
}
export type DecoratedResume = Resume & { template: Template; progress: number; date: string };
export interface AbortSignalLike {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}
export interface AbortControllerLike {
  readonly signal: AbortSignalLike;
  abort(): void;
}
