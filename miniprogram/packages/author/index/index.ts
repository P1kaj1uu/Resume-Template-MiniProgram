import type { PageRegistrar, UIEvent } from '../../../types/platform';

declare const Page: PageRegistrar;

Page({
  data: {
    wechat: 'Dveiklokk',
    email: '891523233@qq.com',
    introduction: [
      {
        icon: '🎓',
        title: '教育经历',
        text: '双非本科（计算机科学与技术） & 211双一流硕士（电子信息）',
      },
      {
        icon: '🌱',
        title: '全栈开发',
        text: '掌握前端（Vue, React） 与 后端（Java, Python, kotlin） 全栈开发实践',
      },
      {
        icon: '👯',
        title: '希望合作',
        text: 'Vue/React 前端项目、Java 后端、Python 应用、kotlin 安卓',
      },
      {
        icon: '💬',
        title: '欢迎交流',
        text: '全栈开发、竞赛经历、技术成长、项目代做、商务合作、工作内推',
      },
    ],
    codes: [
      {
        key: 'wechat',
        title: '微信二维码',
        description: '扫码添加微信，欢迎交流。',
        icon: 'wechat',
        src: '/packages/author/images/add.jpg',
      },
      {
        key: 'support',
        title: '支持作者',
        description: '如果这个小工具对你有帮助，欢迎随心支持。',
        icon: 'heart',
        src: '/packages/author/images/pay.png',
      },
    ],
    imageErrors: {} as Record<string, boolean>,
    previewing: false,
  },
  copyContact(e: UIEvent) {
    const key = e.currentTarget.dataset.key;
    if (key !== 'wechat' && key !== 'email') return;
    wx.setClipboardData({
      data: this.data[key],
      fail: () => wx.showToast({ title: '复制未完成，请重试', icon: 'none' }),
    });
  },
  async previewCode(e: UIEvent) {
    if (this.data.previewing || this.unloaded) return;
    const code = this.data.codes.find((item) => item.key === e.currentTarget.dataset.key);
    if (!code) return;
    this.setData({ previewing: true });
    try {
      // Resolve the packaged image before previewing it on mobile clients.
      const image = await wx.getImageInfo({ src: code.src });
      if (this.unloaded) return;
      await wx.previewImage({ current: image.path, urls: [image.path], showmenu: true });
    } catch {
      if (!this.unloaded) wx.showToast({ title: '图片暂时无法打开，请重试', icon: 'none' });
    } finally {
      if (!this.unloaded) this.setData({ previewing: false });
    }
  },
  onUnload() {
    this.unloaded = true;
  },
  imageFailed(e: UIEvent) {
    const key = e.currentTarget.dataset.key;
    if (this.data.codes.some((item) => item.key === key)) {
      this.setData({ ['imageErrors.' + key]: true });
    }
  },
  retryImage(e: UIEvent) {
    const key = e.currentTarget.dataset.key;
    if (this.data.codes.some((item) => item.key === key)) {
      this.setData({ ['imageErrors.' + key]: false });
    }
  },
});
