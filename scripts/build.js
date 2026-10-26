// Node verification uses the same CommonJS module paths as the native TS compiler.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'miniprogram');
const output = path.join(root, '.build/miniprogram');
fs.rmSync(output, { recursive: true, force: true });
function build(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      build(file);
      continue;
    }
    if (file.endsWith('.d.ts')) continue;
    const target = path.join(output, path.relative(source, file)).replace(/\.ts$/, '.js');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (file.endsWith('.ts')) {
      const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      });
      fs.writeFileSync(target, result.outputText);
    } else fs.copyFileSync(file, target);
  }
}
build(source);
console.log('Compiled TypeScript and copied Mini Program assets to .build/miniprogram.');
