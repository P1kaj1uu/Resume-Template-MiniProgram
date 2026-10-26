/** Node verification fallback; WeChat uses wx.base64ToArrayBuffer. */
declare function atob(value: string): string;

/** Legacy name retained by the pinned WeChat 3.9.3 runtime. */
declare namespace WechatMiniprogram {
  interface Wx {
    loadSubpackage(options: {
      name: string;
      success?: () => void;
      fail?: (error: GeneralCallbackResult) => void;
    }): unknown;
  }
}
