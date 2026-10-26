# 第三方组件

本机文件解析使用以下组件，随源代码提供，不从外部服务加载解析器或上传文档：

| 组件 | 构建版本 | 许可证 |
| --- | --- | --- |
| Mozilla PDF.js / pdfjs-dist | 4.10.38 | Apache-2.0 |
| PDF.js 字符映射 | 随上述版本发布，共 168 份 | Adobe 字符映射许可 |
| web-streams-polyfill | 4.2.0 | MIT |
| @ungap/structured-clone | 1.3.0 | ISC |
| abort-controller | 3.0.0 | MIT |
| event-target-shim | 5.0.1 | MIT |

完整许可证随解析分包保留在：

- `miniprogram/packages/pdf-reader/vendor/LICENSE.txt`
- `miniprogram/packages/pdf-reader/vendor/CMAP_LICENSE.txt`
- `miniprogram/packages/pdf-reader/vendor/THIRD_PARTY_LICENSES.txt`

`scripts/pdf-entry.js` 是微信运行环境适配入口，`scripts/build-pdf-parser.js` 负责生成解析器及打包字符映射。构建工具 esbuild 仅用于开发，不在小程序中执行。版本以 `package-lock.json` 为准。
