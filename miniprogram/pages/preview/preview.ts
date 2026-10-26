import type { LoadOptions, PageRegistrar, UIEvent } from '../../types/platform';
import type {
  ContentInput,
  OperationError,
  Resume,
  ReviewIssue,
  Template,
} from '../../types/resume';
import { findTemplate, templates } from '../../utils/catalog';
import { review } from '../../utils/review';
declare const Page: PageRegistrar;
import store = require('../../utils/data');
import reward = require('../../utils/reward');
import pdf = require('../../utils/pdf');
import files = require('../../utils/file-delivery');
Page({
  data: {
    resume: null as Resume | null,
    template: templates[0],
    previewContent: store.sample as ContentInput,
    isSample: true,
    targetId: '',
    targetTitle: '',
    busy: false,
    unlocked: true,
    favorite: false,
    variants: [] as Template[],
    missing: false,
    pageCount: 1,
    measureError: '',
    exportWarnings: [] as ReviewIssue[],
    exportErrors: [] as ReviewIssue[],
    coreProgress: 0,
    exportedFile: '',
    exportedName: '',
    fileStatus: '',
    saveLabel: '发送文件',
    downloadHint: '',
    deliveryDetail: '',
    preparedFile: '',
    preparing: false,
    prepareError: '',
    loadError: '',
  },
  onLoad(options: LoadOptions = {}) {
    this.loadOptions = options;
    this.setData({ missing: false, loadError: '' });
    const desktop = files.target() === 'disk';
    this.setData({
      saveLabel: desktop ? '再次保存' : '发送文件',
      downloadHint: desktop
        ? '点击下载，选择保存位置即可保存简历文件。'
        : '点击下载会打开文件发送窗口，发送到微信聊天后即可保存。',
    });
    let resume, target;
    try {
      resume = options.id ? store.get(options.id) : null;
      target = options.target ? store.get(options.target) : null;
    } catch (e) {
      this.setData({ missing: true, loadError: e.message || '本机资料暂时无法读取' });
      return;
    }
    if ((options.id && !resume) || (options.target && !target)) {
      this.setData({ missing: true });
      return;
    }
    this.setData({
      resume,
      isSample: !resume,
      targetId: target ? target.id : '',
      targetTitle: target ? target.title : '',
      previewContent: resume ? resume.content : target ? target.content : store.sample,
    });
    try {
      this.setTemplate(findTemplate(resume ? resume.templateId : options.template));
    } catch (e) {
      this.setData({ missing: true, loadError: e.message || '本机模板记录暂时无法读取' });
    }
  },
  retryLoad() {
    this.onLoad(this.loadOptions || {});
  },
  onShow() {
    if (!this.data.missing)
      try {
        this.setData({ favorite: store.favorites().includes(this.data.template.id) });
      } catch (e) {
        this.setData({ loadError: e.message });
      }
  },
  setTemplate(template: Template) {
    this.setData({
      template,
      unlocked: template.free || reward.unlocked(template.id),
      favorite: store.favorites().includes(template.id),
      variants: templates.filter((t) => t.familyId === template.familyId),
    });
    this.updateMeta();
  },
  updateMeta() {
    const content = this.data.previewContent;
    const result = review(content);
    let pageCount = 1,
      measureError = '';
    try {
      pageCount = pdf.pageCount({ content }, this.data.template);
    } catch (e) {
      measureError = String(e.message || '').includes('内容过长')
        ? e.message
        : '暂时无法计算页数，请返回编辑检查内容。';
    }
    this.setData({
      pageCount,
      measureError,
      exportWarnings: result.warnings,
      exportErrors: result.errors,
      coreProgress: store.completion(content),
    });
    if (this.data.resume && !measureError && !result.errors.length) this.prepareFile();
  },
  variant(e: UIEvent) {
    if (!this.data.busy) this.setTemplate(findTemplate(e.currentTarget.dataset.id));
  },
  favorite() {
    try {
      const ids = store.toggleFavorite(this.data.template.id);
      this.setData({ favorite: ids.includes(this.data.template.id) });
      wx.showToast({ title: this.data.favorite ? '已收藏' : '已取消收藏', icon: 'none' });
    } catch (e) {
      wx.showToast({ title: '收藏未保存，请重试', icon: 'none' });
    }
  },
  async ensureUnlocked() {
    const t = this.data.template;
    if (t.free || reward.unlocked(t.id)) return !this.unloaded;
    const result = await wx.showModal({
      title: '解锁「' + t.name + '」',
      content:
        '完整观看一段广告视频，即可在本设备持续使用这款模板。中途关闭不会解锁，免费模板可直接使用。',
      confirmText: '观看并解锁',
    });
    if (!result.confirm || this.unloaded) return false;
    const granted = await reward.unlock(t.id);
    if (this.unloaded) return false;
    this.setData({ unlocked: true });
    if (granted && granted.persisted === false)
      wx.showModal({
        title: '本次已解锁',
        content: '当前可以使用此模板，但设备空间不足，解锁记录未能保存；重启后可能需要重新解锁。',
        showCancel: false,
      });
    return true;
  },
  async use() {
    if (this.data.busy || this.data.missing) return;
    this.setData({ busy: true });
    try {
      if (!(await this.ensureUnlocked()) || this.unloaded) return;
      let resume;
      if (this.data.targetId) {
        resume = store.changeTemplate(this.data.targetId, this.data.template.id);
        wx.removeStorageSync('template_target_v1');
      } else resume = store.create(this.data.template.id);
      wx.redirectTo({ url: '/pages/editor/editor?id=' + resume.id });
    } catch (e) {
      wx.showToast({ title: e.message || '暂时无法使用，请重试', icon: 'none', duration: 3000 });
    } finally {
      if (!this.unloaded) this.setData({ busy: false });
    }
  },
  edit() {
    if (!this.data.resume) return;
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [],
      previous = pages[pages.length - 2];
    if (
      previous &&
      (previous.route || previous.path) === 'pages/editor/editor' &&
      previous.data &&
      previous.data.resume &&
      previous.data.resume.id === this.data.resume.id
    )
      wx.navigateBack();
    else wx.redirectTo({ url: '/pages/editor/editor?id=' + this.data.resume.id });
  },
  gallery() {
    if (!this.data.resume) return;
    try {
      wx.setStorageSync('template_target_v1', this.data.resume.id);
      wx.switchTab({ url: '/pages/templates/templates' });
    } catch (e) {
      wx.showToast({ title: '暂时无法打开模板馆，请检查本机空间', icon: 'none' });
    }
  },
  // Prepare before the tap: WeChat file APIs require an active user gesture.
  preparationKey() {
    return JSON.stringify([this.data.template.id, this.data.resume && this.data.resume.content]);
  },
  prepareFile(): Promise<string> {
    if (!this.data.resume || this.unloaded) return Promise.resolve('');
    const key = this.preparationKey();
    if (this.data.preparedFile && this.preparedKey === key)
      return Promise.resolve(this.data.preparedFile);
    if (this.preparingPromise)
      return this.preparingPromise.then(() => (this.unloaded ? '' : this.prepareFile()));
    if (this.data.preparedFile && this.data.preparedFile !== this.data.exportedFile)
      this.removePreparedFile(this.data.preparedFile);
    if (this.data.exportedFile && pdf.releaseFile) pdf.releaseFile(this.data.exportedFile);
    this.setData({
      preparedFile: '',
      exportedFile: '',
      exportedName: '',
      fileStatus: '',
      preparing: true,
      prepareError: '',
    });
    this.preparingPromise = pdf
      .exportResume(this.data.resume, this.data.template)
      .then((filePath) => {
        if (this.unloaded || this.preparationKey() !== key) {
          this.removePreparedFile(filePath);
          return '';
        }
        this.preparedKey = key;
        this.setData({ preparedFile: filePath });
        return filePath;
      })
      .catch((e) => {
        if (!this.unloaded) this.setData({ prepareError: e.message || '文件准备失败，请重试。' });
        return '';
      })
      .finally(() => {
        this.preparingPromise = null;
        if (!this.unloaded) this.setData({ preparing: false });
      });
    return this.preparingPromise;
  },
  removePreparedFile(filePath: string) {
    try {
      wx.getFileSystemManager().unlinkSync(filePath);
    } catch (e) {}
    if (pdf.releaseFile) pdf.releaseFile(filePath);
  },
  onUnload() {
    this.unloaded = true;
    if (this.data.preparedFile && this.data.preparedFile !== this.data.exportedFile)
      this.removePreparedFile(this.data.preparedFile);
    if (pdf.releaseFile && this.data.exportedFile) pdf.releaseFile(this.data.exportedFile);
  },
  export() {
    if (!this.data.resume || this.data.busy || this.data.preparing || this.unloaded) return;
    if (this.data.measureError || this.data.exportErrors.length) {
      wx.showToast({ title: '请先返回编辑完善信息', icon: 'none' });
      return;
    }
    if (!this.data.template.free && !reward.unlocked(this.data.template.id)) {
      this.setData({ busy: true });
      return this.ensureUnlocked()
        .then((ok) => {
          if (ok && !this.unloaded) wx.showToast({ title: '已解锁，请点击下载简历', icon: 'none' });
        })
        .catch((e) => this.showDeliveryError(e))
        .finally(() => {
          if (!this.unloaded) this.setData({ busy: false });
        });
    }
    const filePath = this.data.preparedFile;
    if (!filePath || this.preparedKey !== this.preparationKey()) {
      this.prepareFile();
      return;
    }
    this.setData({
      busy: true,
      deliveryDetail: '',
      exportedFile: filePath,
      exportedName: filePath.split('/').pop() || '',
      fileStatus: '文件已准备好，正在打开保存或发送窗口。',
    });
    // Do not await anything before deliverFile; stay in the original tap stack.
    return this.deliverFile()
      .catch((e) => this.showDeliveryError(e))
      .finally(() => {
        if (!this.unloaded) this.setData({ busy: false });
      });
  },
  showDeliveryError(e: OperationError) {
    if (this.unloaded) return;
    if (e.kind === 'missing') {
      this.removePreparedFile(this.data.preparedFile);
      this.preparedKey = '';
      this.setData({ preparedFile: '', exportedFile: '' });
      this.prepareFile();
    }
    this.setData({
      fileStatus: e.message || '操作未完成，请重试。',
      deliveryDetail: e.detail || '',
    });
    wx.showModal({
      title: '文件尚未保存或发送',
      content: e.message || '请稍后重试。',
      showCancel: false,
    });
  },
  async deliverFile() {
    const result = await files.deliver(this.data.exportedFile);
    if (this.unloaded) return;
    this.setData({
      deliveryDetail: '',
      fileStatus: result.cancelled
        ? '已取消本次操作，文件仍保留，可再次保存或发送。'
        : result.destination === 'disk'
          ? '已保存到你选择的位置。'
          : '文件已发送，可在微信聊天中打开并保存。',
    });
  },
  async saveFile() {
    if (!this.data.exportedFile || this.data.busy || this.unloaded) return;
    this.setData({ busy: true, deliveryDetail: '' });
    try {
      await this.deliverFile();
    } catch (e) {
      this.showDeliveryError(e);
    } finally {
      if (!this.unloaded) this.setData({ busy: false });
    }
  },
  async viewFile() {
    if (!this.data.exportedFile || this.data.busy) return;
    this.setData({ busy: true });
    try {
      await wx.openDocument({ filePath: this.data.exportedFile, fileType: 'pdf', showMenu: true });
    } catch (e) {
      if (!this.unloaded) wx.showToast({ title: '暂时无法打开，请重新下载', icon: 'none' });
    } finally {
      if (!this.unloaded) this.setData({ busy: false });
    }
  },
  home() {
    wx.switchTab({ url: '/pages/resumes/resumes' });
  },
  onShareAppMessage() {
    return {
      title: '好简历 · ' + this.data.template.name,
      path: '/pages/preview/preview?template=' + this.data.template.id,
    };
  },
});
