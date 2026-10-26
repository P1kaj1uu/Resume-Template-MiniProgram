const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { templates } = require('../.build/miniprogram/utils/catalog');
const { buildResume } = require('../.build/miniprogram/utils/pdf');
const { detailed } = require('./fixtures');

test('TypeScript PDF output matches the JavaScript baseline for all 320 templates', () => {
  // Captured before migration: includes optional sections, visibility, order and typography.
  const hash = createHash('sha256');
  for (const template of templates) {
    const content = detailed();
    content.hiddenSections = ['certificates'];
    content.sectionOrder = ['custom_custom1', 'projects', 'summary'];
    content.preferences = { fontSize: 'small', spacing: 'compact', margin: 'narrow' };
    hash.update(template.id + '\n' + buildResume({ content }, template));
  }
  assert.equal(
    hash.digest('hex'),
    'e8411c02aa618a05c115dc656b1682b36e165904b1ae48042433113240754c5e',
  );
});
