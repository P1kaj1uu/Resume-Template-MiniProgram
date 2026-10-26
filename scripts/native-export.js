const automator = require('miniprogram-automator');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parse = require('pdf-parse/lib/pdf-parse.js');
const { templates } = require('../.build/miniprogram/utils/data');
const { detailed } = require('../tests/fixtures');

(async () => {
  const mini = await automator.connect({ wsEndpoint: process.env.WECHAT_WS || 'ws://127.0.0.1:9420' });
  let recordID;
  try {
    let page = await mini.reLaunch('/pages/index/index');
    await page.waitFor(400);
    await (await page.$('.hero-button')).tap();
    await page.waitFor(800);
    page = await mini.currentPage();
    const templateIndex=templates.findIndex(t=>t.id===(process.env.EXPORT_TEMPLATE||'classic'));
    assert.ok(templateIndex>=0,'模板存在');
    await page.callMethod('template',{detail:{value:templateIndex}});
    recordID = (await page.data()).resume.id;
    await page.callMethod('input', {
      currentTarget: { dataset: { path: 'resume.content' } },
      detail: { value: { ...detailed(), name: '导出功能测试' } },
    });
    await page.callMethod('save');
    await page.callMethod('preview');
    await page.waitFor(800);
    page = await mini.currentPage();
    assert.equal(page.path, 'pages/preview/preview');
    if(process.env.WECHAT_SKIP_SCREENSHOTS!=='1')await mini.screenshot({ path: path.resolve(__dirname, '../artifacts/preview.png') });
    await mini.mockWxMethod('openDocument', function () {
      wx.setStorageSync('__export_test_opened', true);
      return { errMsg: 'openDocument:ok' };
    });
    await mini.mockWxMethod('shareFileMessage', function (options) {
      wx.setStorageSync('__export_test_path', options.filePath);
      wx.setStorageSync('__export_test_delivery', 'chat');
      return { errMsg: 'shareFileMessage:ok' };
    });
    await mini.mockWxMethod('saveFileToDisk', function (options) {
      wx.setStorageSync('__export_test_path', options.filePath);
      wx.setStorageSync('__export_test_delivery', 'disk');
      return { errMsg: 'saveFileToDisk:ok' };
    });
    for(let i=0;i<50&&!(await page.data()).preparedFile;i++)await page.waitFor(100);
    assert.ok((await page.data()).preparedFile,'点击前已经准备好文件');
    await (await page.$('.download-action')).tap();
    await page.waitFor(800);
    const base64 = await mini.evaluate(() => {
      const filePath = wx.getStorageSync('__export_test_path');
      if (!filePath) return '';
      return wx.getFileSystemManager().readFileSync(filePath, 'base64');
    });
    assert.ok(base64, '简历文件已写入小程序文件系统并交给文件保存或发送接口');
    assert.equal(await mini.evaluate(()=>!!wx.getStorageSync('__export_test_opened')),false,'下载不自动打开文档');
    assert.match((await page.data()).fileStatus,/已保存|已发送/);
    const buffer = Buffer.from(base64, 'base64');
    const result = await parse(buffer);
    assert.match(result.text, /导出功能测试/);
    assert.match(result.text, /浙江工商大学/);
    assert.match(result.text.replace(/\s/g,''), /数据分析职业证书/);
    assert.match(result.text.replace(/\s/g,''), /志愿服务/);
    assert.match(buffer.toString('ascii'), /\/Subtype \/Link/);
    assert.equal((await page.data()).pageCount,result.numpages);
    fs.writeFileSync(path.resolve(__dirname, '../artifacts/sample-resume.pdf'), buffer);
    console.log('通过：真实生成文件、写入存储及中文提取，下载不自动打开预览；系统保存和发送窗口为测试替身。');
  } finally {
    try {
    await mini.restoreWxMethod('openDocument');
    await mini.restoreWxMethod('shareFileMessage');
    await mini.restoreWxMethod('saveFileToDisk');
    await mini.evaluate((id) => {
      const records = wx.getStorageSync('resumes_v1') || [];
      wx.setStorageSync('resumes_v1', records.filter((r) => r.id !== id));
      const versions=wx.getStorageSync('resume_versions_v1')||{};delete versions[id];wx.setStorageSync('resume_versions_v1',versions);
      const filePath = wx.getStorageSync('__export_test_path');
      if (filePath) try { wx.getFileSystemManager().unlinkSync(filePath); } catch (e) {}
      wx.removeStorageSync('__export_test_path');
      wx.removeStorageSync('__export_test_opened');
      wx.removeStorageSync('__export_test_delivery');
    }, recordID);
    await mini.switchTab('/pages/index/index');
    } finally { await mini.disconnect(); }
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
