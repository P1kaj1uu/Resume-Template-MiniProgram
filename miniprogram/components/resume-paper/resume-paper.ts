import type { ContentInput, DesignInput, Section } from '../../types/resume';
import { effectiveDesign } from '../../utils/content-schema';
import { sample } from '../../utils/data';
import { layoutFor, partitionSections, sectionsFor } from '../../utils/layout';
Component({
  properties: {
    content: { type: Object, value: sample },
    design: { type: Object, value: {} },
    theme: { type: String, value: 'classic' },
    color: { type: String, value: '#315d4d' },
    thumbnail: { type: Boolean, value: false },
  },
  data: {
    layout: {},
    sections: [] as Section[],
    side: [] as Section[],
    main: [] as Section[],
    resolved: {},
    thumbMain: [] as { key: string; title: string; number?: string; preview: string }[],
    thumbSide: [] as { key: string; title: string; number?: string; preview: string }[],
  },
  observers: {
    'content,design,theme,color,thumbnail': function (
      content: ContentInput,
      design: Partial<DesignInput>,
      theme: string,
      color: string,
    ) {
      const base = Object.assign(
        { style: theme, color, tint: '#e8eee8', density: 'standard' },
        design || {},
      );
      const resolved = effectiveDesign(base, content || sample),
        sections = sectionsFor(content || sample, resolved),
        parts = partitionSections(sections, resolved);
      const thumb = (rows: Section[]) =>
        rows.map((s) => ({
          key: s.key,
          title: s.title,
          number: s.number,
          preview: s.entries.length ? s.entries[0].primary : s.body.slice(0, 34),
        }));
      this.setData({
        resolved,
        layout: Object.assign({}, layoutFor(resolved), parts.side.length ? {} : { columns: '' }),
        sections,
        side: parts.side,
        main: parts.main,
        thumbMain: thumb(parts.main),
        thumbSide: thumb(parts.side),
      });
    },
  },
});
