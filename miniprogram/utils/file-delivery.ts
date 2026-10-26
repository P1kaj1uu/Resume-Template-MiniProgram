import type { OperationError } from '../types/resume';
type Destination = 'disk' | 'chat';
interface DeliveryResult {
  destination: Destination;
  cancelled: boolean;
}
function deviceInfo(): { platform?: string } {
  try {
    if (typeof wx.getDeviceInfo === 'function') {
      const info = wx.getDeviceInfo();
      if (info && typeof info === 'object') return info;
    }
  } catch (e) {}
  try {
    return wx.getSystemInfoSync() || {};
  } catch (e) {
    return {};
  }
}
function target(): Destination {
  return ['windows', 'mac', 'macos'].includes(String(deviceInfo().platform || '').toLowerCase())
    ? 'disk'
    : 'chat';
}
function deliveryError(
  error: { errMsg?: string; message?: string } | null,
  destination: Destination,
) {
  const detail = String((error && error.errMsg) || (error && error.message) || '').slice(0, 400);
  let message;
  if (/user.*(?:tap|gesture)|user gesture|must.*tap/i.test(detail))
    message = '请直接点击“发送文件”或“再次保存”重试，微信要求由点击操作打开文件窗口。';
  else if (/not support|not available|not implement|不支持/i.test(detail))
    message =
      deviceInfo().platform === 'devtools'
        ? '开发者工具不支持此文件操作，请使用手机预览；也可点击“查看文件”检查已生成的简历。'
        : '当前微信版本不支持此文件操作，请更新微信；也可点击“查看文件”后从菜单保存。';
  else if (/no such|not exist|file.*(?:invalid|empty)|file not found|路径|不存在/i.test(detail))
    message = '文件已失效，将重新准备；文件就绪后请再次点击下载。';
  else if (/permission|authorize|auth deny|privacy|scope/i.test(detail))
    message = '微信未允许此文件操作，可点击“查看文件”后从文档菜单保存。';
  else if (/network|net error|offline|timeout/i.test(detail))
    message = '文件尚未发送，请检查网络后点击“发送文件”重试。';
  else
    message =
      destination === 'disk'
        ? '文件未保存，可点击“再次保存”重试，或查看文件后从菜单保存。'
        : '微信未完成文件发送，可直接点击“发送文件”重试，或查看文件后从菜单保存。';
  const result: OperationError = new Error(message);
  result.detail = detail;
  result.kind = /no such|not exist|not found|invalid.*file|file.*invalid|ENOENT/i.test(detail)
    ? 'missing'
    : 'delivery';
  return result;
}
function deliver(filePath: string): Promise<DeliveryResult> {
  const destination = target(),
    api = destination === 'disk' ? 'saveFileToDisk' : 'shareFileMessage';
  if (typeof filePath !== 'string' || !filePath)
    return Promise.reject(deliveryError({ errMsg: 'file not found' }, destination));
  try {
    const fs = typeof wx.getFileSystemManager === 'function' ? wx.getFileSystemManager() : null;
    if (fs && typeof fs.accessSync === 'function') fs.accessSync(filePath);
  } catch (e) {
    return Promise.reject(deliveryError({ errMsg: 'file not found' }, destination));
  }
  if (typeof wx[api] !== 'function')
    return Promise.reject(deliveryError({ errMsg: api + ':fail not supported' }, destination));
  // The Promise executor runs synchronously, preserving the caller's tap gesture.
  return new Promise((resolve, reject) => {
    const fail = (error: { errMsg?: string; message?: string }) => {
      if (/cancel|取消/i.test((error && (error.errMsg || error.message)) || ''))
        resolve({ destination, cancelled: true });
      else reject(deliveryError(error, destination));
    };
    try {
      wx[api]({
        filePath,
        ...(destination === 'chat' ? { fileName: filePath.split('/').pop() } : {}),
        success: () => resolve({ destination, cancelled: false }),
        fail,
      });
    } catch (error) {
      fail(error);
    }
  });
}
export { deliver, target };
