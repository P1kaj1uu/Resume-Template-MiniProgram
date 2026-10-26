import type { UIEvent } from '../types/platform';
interface TabData {
  selected: number;
  tabs: { name: string; path: string; icon: string }[];
}
Component<TabData, {}, { switchTab(e: UIEvent): void }, [], { switching?: boolean }>({
  data: {
    selected: 0,
    tabs: [
      { name: '首页', path: 'index', icon: 'home' },
      { name: '模板', path: 'templates', icon: 'grid' },
      { name: '简历', path: 'resumes', icon: 'file' },
      { name: '我的', path: 'profile', icon: 'user' },
    ],
  },
  methods: {
    switchTab(e: UIEvent) {
      const i = Number(e.currentTarget.dataset.index);
      if (this.switching || i === this.data.selected || !this.data.tabs[i]) return;
      this.switching = true;
      try {
        wx.removeStorageSync('template_target_v1');
      } catch (error) {
        this.switching = false;
        wx.showToast({ title: '本机状态暂时无法更新，请重试', icon: 'none' });
        return;
      }
      wx.switchTab({
        url: '/pages/' + this.data.tabs[i].path + '/' + this.data.tabs[i].path,
        fail: () => wx.showToast({ title: '页面暂时无法打开，请重试', icon: 'none' }),
        complete: () => {
          this.switching = false;
        },
      });
    },
  },
});
