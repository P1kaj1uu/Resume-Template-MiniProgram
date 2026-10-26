import type { AbortSignalLike, OperationError } from '../../types/resume';
import type { PdfTask } from './vendor/parser';
import { createAbortController, getDocument } from './vendor/parser';
import maps = require('../../vendor/pdf-cmaps');
const MAX_BYTES = 8 * 1024 * 1024,
  MAX_PAGES = 15,
  MAX_TEXT = 60000;
function decode(value: string) {
  if (typeof wx !== 'undefined' && typeof wx.base64ToArrayBuffer === 'function')
    return new Uint8Array(wx.base64ToArrayBuffer(value));
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
class LocalCMaps {
  fetch({ name }: { name: string }) {
    if (!Object.prototype.hasOwnProperty.call(maps, name))
      return Promise.reject(Error('字符映射缺失'));
    return Promise.resolve({ cMapData: decode(maps[name]), isCompressed: true });
  }
}
class LocalFonts {
  fetch() {
    return Promise.reject(Error('文档未提供可用字体数据'));
  }
}
function friendly(error: OperationError) {
  if (error && error.local) return error;
  const names: Record<string, string> = {
    PasswordException: '文件已加密，请先移除密码后重新选择。',
    InvalidPDFException: '文件已损坏或不是有效的简历文档，请重新导出后再试。',
    MissingPDFException: '文件不存在，请重新选择。',
  };
  const result: OperationError = new Error(
    names[error && error.name] ||
      '这份文件暂时无法在本机读取，请重新导出文字型文档，或复制文字检查。',
  );
  result.detail = String((error && error.stack) || (error && error.message) || '').slice(0, 1200);
  return result;
}
function fail(message: string): never {
  const e: OperationError = new Error(message);
  e.local = true;
  throw e;
}
async function extractPdf(
  input: Uint8Array | ArrayBuffer,
  onProgress: (page: number, total: number) => void = () => {},
  options: { signal?: AbortSignalLike } = {},
): Promise<{ text: string; pageCount: number }> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!bytes.byteLength) fail('文件为空，请重新选择。');
  if (bytes.byteLength > MAX_BYTES) fail('文件超过八兆，请压缩后再试。');
  if (
    !Array.from(bytes.subarray(0, 1024), (n) => String.fromCharCode(n))
      .join('')
      .includes('%PDF-')
  )
    fail('文件内容不是有效的简历文档，请重新选择。');
  let task: PdfTask | undefined,
    timer: ReturnType<typeof setTimeout> | undefined,
    abort: (() => void) | undefined;
  const signal = options.signal;
  if (signal && signal.aborted) fail('已取消文件解析。');
  try {
    task = getDocument({
      data: bytes,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true,
      useWorkerFetch: false,
      isOffscreenCanvasSupported: false,
      isImageDecoderSupported: false,
      stopAtErrors: true,
      CMapReaderFactory: LocalCMaps,
      StandardFontDataFactory: LocalFonts,
      verbosity: 0,
    });
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const e: OperationError = new Error('文件解析时间较长，请精简后重试，或复制文字检查。');
        e.local = true;
        reject(e);
      }, 30000);
    });
    const cancelled = new Promise<never>((_, reject) => {
      abort = () => {
        const error: OperationError = new Error('已取消文件解析。');
        error.local = true;
        reject(error);
      };
      if (signal) signal.addEventListener('abort', abort, { once: true });
    });
    return await Promise.race([
      (async () => {
        const doc = await task!.promise;
        if (doc.numPages > MAX_PAGES) fail('文件超过十五页，请只保留需要检查的简历页。');
        let text = '';
        for (let n = 1; n <= doc.numPages; n++) {
          onProgress(n, doc.numPages);
          const page = await doc.getPage(n),
            content = await page.getTextContent();
          for (const item of content.items) {
            if (typeof item.str === 'string') text += item.str + (item.hasEOL ? '\n' : ' ');
          }
          text += '\n';
          page.cleanup();
          if (text.length > MAX_TEXT) fail('文件文字过多，请只保留简历正文后重新选择。');
        }
        text = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
        if (text.replace(/\s/g, '').length < 10)
          fail(
            '没有读取到足够的文字，文件可能是照片、扫描件或缺少文字层。请使用文字型文档，或粘贴文字检查。',
          );
        return { text, pageCount: doc.numPages };
      })(),
      timeout,
      cancelled,
    ]);
  } catch (e) {
    throw friendly(e);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (signal && abort) signal.removeEventListener('abort', abort);
    if (task) {
      let cleanup: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          task.destroy(),
          new Promise((resolve) => {
            cleanup = setTimeout(resolve, 1000);
          }),
        ]);
      } catch (e) {
      } finally {
        if (cleanup !== undefined) clearTimeout(cleanup);
      }
    }
  }
}
export { createAbortController, extractPdf, MAX_BYTES, MAX_PAGES };
