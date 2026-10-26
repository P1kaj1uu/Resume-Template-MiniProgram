import type { PageRegistrar, UIEvent } from '../../types/platform';
import type { Resume, Template } from '../../types/resume';
import { categories, families, filterTemplates, templates } from '../../utils/catalog';
declare const Page: PageRegistrar;
import store = require('../../utils/data');
const PAGE_SIZE = 18;
Page({
  data: {
    categories,
    active: '全部',
    query: '',
    groups: ['全部版式', '简约', '商务', '双栏', '校园', '创意'],
    groupIndex: 0,
    access: '全部',
    list: [] as Template[],
    total: 0,
    shown: 0,
    hasMore: false,
    favoriteCount: 0,
    catalogCount: templates.length,
    layoutCount: families.length,
    target: null as Resume | null,
    loadError: '',
  },
  onLoad() {
    this.apply();
  },
  onShow() {
    const bar = this.getTabBar();
    if (bar) bar.setData({ selected: 1 });
    try {
      const id = wx.getStorageSync('template_target_v1');
      const access = wx.getStorageSync('template_access_v1');
      wx.removeStorageSync('template_access_v1');
      this.setData({
        target: id ? store.get(id) || null : null,
        ...(access ? { access, active: '全部', query: '', groupIndex: 0 } : {}),
      });
      this.apply(!access ? false : true);
    } catch (e) {
      this.setData({ loadError: e.message || '模板记录暂时无法读取' });
    }
  },
  filter(e: UIEvent) {
    this.setData({ active: e.currentTarget.dataset.value });
    this.apply();
  },
  search(e: UIEvent) {
    this.setData({ query: e.detail.value });
    this.apply();
  },
  clearSearch() {
    this.setData({ query: '' });
    this.apply();
  },
  group(e: UIEvent) {
    this.setData({ groupIndex: Number(e.detail.value) });
    this.apply();
  },
  access(e: UIEvent) {
    this.setData({ access: e.currentTarget.dataset.value });
    this.apply();
  },
  apply(reset = true) {
    try {
      const favorites = store.favorites();
      this.matches = filterTemplates({
        category: this.data.active,
        query: this.data.query,
        group: this.data.groups[this.data.groupIndex],
        access: this.data.access,
        favorites,
      });
      const shown = Math.min(
        this.matches!.length,
        reset ? PAGE_SIZE : Math.max(PAGE_SIZE, this.data.shown),
      );
      this.setData({
        list: this.matches!.slice(0, shown),
        total: this.matches!.length,
        shown,
        hasMore: shown < this.matches!.length,
        favoriteCount: favorites.length,
        loadError: '',
      });
    } catch (e) {
      this.setData({ loadError: e.message || '收藏记录暂时无法读取' });
    }
  },
  loadMore() {
    if (!this.data.hasMore) return;
    const shown = Math.min(this.matches!.length, this.data.shown + PAGE_SIZE);
    this.setData({
      list: this.matches!.slice(0, shown),
      shown,
      hasMore: shown < this.matches!.length,
    });
  },
  onReachBottom() {
    this.loadMore();
  },
  favorite(e: UIEvent) {
    try {
      const ids = store.toggleFavorite(e.currentTarget.dataset.id);
      this.apply(false);
      wx.showToast({
        title: ids.includes(e.currentTarget.dataset.id) ? '已收藏' : '已取消收藏',
        icon: 'none',
      });
    } catch (e) {
      wx.showToast({ title: '收藏未保存，请检查存储空间', icon: 'none' });
    }
  },
  cancelTarget() {
    wx.removeStorageSync('template_target_v1');
    this.setData({ target: null as Resume | null });
  },
  reset() {
    this.setData({ query: '', active: '全部', groupIndex: 0, access: '全部' });
    this.apply();
  },
  preview(e: UIEvent) {
    const suffix = this.data.target ? '&target=' + this.data.target.id : '';
    wx.navigateTo({
      url: '/pages/preview/preview?template=' + e.currentTarget.dataset.id + suffix,
    });
  },
});
