# 研时记 · 安装包分发服务

让手机用户**方便安装** App 的最小分发服务。App 本身是纯本地单机应用、不需要联网，本服务只负责「把 APK 发给用户、让用户装上」。

## 技术说明

- 纯 **Node 内置 `http` 模块**实现，**零第三方依赖**，不用 `npm install`，`node server.js` 就能跑。
- 单文件主服务（`server.js`）+ 独立发布脚本（`publish.js`）。
- 支持 HTTP Range 断点续传（移动端浏览器分块下载必需）、路径穿越防护、`Content-Disposition` 下载头。

## 目录结构

```
backend/
├── server.js          # 分发服务（入口）
├── publish.js         # 发布脚本：登记新版本 APK
├── package.json       # 元数据 + 启动命令
├── public/
│   ├── index.html     # 移动端下载页（版本卡 / 下载按钮 / 二维码 / 安装说明）
│   └── qrcode.js      # 二维码生成库（内置，MIT）
└── data/
    ├── versions.json  # 版本清单（服务启动时读取）
    └── apk/           # 已发布的 APK 存放目录
```

## 一、快速开始（本地 / 局域网测试）

```bash
cd backend
node server.js
```

启动后控制台会打印：
- 本机访问：`http://localhost:8080/`
- 局域网访问：`http://<电脑IP>:8080/`

手机和电脑连同一个 Wi-Fi，手机浏览器打开上面的「局域网访问」地址即可看到下载页。

> ⚠️ 正式分发给用户**必须用 HTTPS**，见下节。手机系统浏览器会拦截普通 HTTP 下的 APK 下载（安全策略）。

## 二、正式部署（必须 HTTPS）

Android 系统及 Chrome 会拦截**非 HTTPS** 的 APK 下载，所以正式分发需要：**域名 + HTTPS 证书**。

推荐方案（国内，选一即可）：

1. **轻量云服务器**（腾讯云 / 阿里云 / 华为云），约 ¥50/年。
   - 安装 Node 后上传本目录，`node server.js` 常驻（用 `pm2` 或 systemd）。
   - 绑定域名，申请**免费 SSL 证书**（腾讯云/阿里云都有免费证书，或 Let's Encrypt）。
   - 域名解析到服务器 IP，证书配置在服务器（Nginx 反代）或直接用 Node 起 HTTPS。
2. **静态托管兜底**（如果不想维护服务器）：
   - 把 `public/` 页面 + APK 文件放到支持 HTTPS 的静态托管（如 GitHub Pages / Gitee Pages / 云厂商对象存储 + CDN），
   - 但动态版本清单（`versions.json`）需要手工维护，体验略差。
   - **最省事**：直接建一个带密码/公开的网盘分享链接（百度网盘/夸克），配合本页面的安装说明文案使用。

> 国内云服务器需完成**备案**才能绑定域名（海外节点可跳过备案，但访问速度会慢）。

## 三、发布新版本（前端团队操作）

前端团队拿到构建产物（`app-release.apk`）后，运行：

```bash
cd backend
node publish.js ./app-release.apk --version 1.0.0 --changelog "首个版本，支持倒计时/计时/统计/日志"
```

脚本会：复制 APK 到 `data/apk/` → 计算大小与 SHA-256 → 更新 `data/versions.json` → 输出摘要。
**重启分发服务**后，用户访问下载页即看到新版本。

更多用法：

```bash
# 指定构建号 + 多条更新说明
node publish.js ./app-release.apk --version 1.1.0 --build 3 \
  --changelog "修复倒计时偶发不刷新" \
  --changelog "统计页新增空态提示"

# 回滚到旧版本：把旧 APK 重新 publish 到对应版本号即可（build 号递增）
```

## 四、前端打包契约（React + Capacitor 团队必读）

当前前端是 **React (Vite) Web 应用 + Capacitor 原生壳**（`app/` 目录），APK 由 Capacitor 工程编译产出。

| 项 | 要求 |
|---|---|
| Web 构建 | `npm run build`（本仓库统一用 `--base=/` 输出到 `dist-capacitor`，供 Capacitor 打包；`dist/` 用于 Web 在线版，base 为 `/public/web/`） |
| 原生工程 | `app/android/`，由 `npx cap add android` 生成；`npx cap sync` 在 web 更新后同步资源 |
| APK 产物 | `app/android/app/build/outputs/apk/release/app-release.apk` |
| **签名** | release 已配置签名：密钥 `android/app/yanshiji-release.keystore`，凭据在 `android/keystore.properties`（**勿泄露、勿丢失，丢失后已安装用户无法覆盖升级**） |
| 版本号 | `android/app/build.gradle` 中 `versionName`/`versionCode`，与发布脚本的 `--version`、`--build` 保持一致 |
| 分发 | `node publish.js <app-release.apk> --version x.y.z --changelog "..."` 登记后**无需重启服务**（版本清单按请求实时读取） |
| 应用标识 | `applicationId` = `com.yanshiji.app` |

**App 内建议**（纯本地应用，不改「无需联网」定位）：
- 「关于」页展示版本号，方便用户对照下载页核对自己是否最新。
- 若将来要做自动更新检查，会引入联网需求，与「无需联网」定位冲突，需重新评估——本期不做。

**重新构建 APK 的完整流程**（web 更新后）：
```bash
cd app
MSYS_NO_PATHCONV=1 npx vite build --base=/ --outDir=dist-capacitor   # 打包 Web 资源
npx cap sync android                                                  # 同步资源到原生工程
cd android && ./gradlew assembleRelease                               # 编译签名 APK
```

## 五、常见问题

**1. 微信 / QQ 内打开下载被拦截？**
内置浏览器会拦 APK。下载页已对微信/QQ 用户自动弹出提示：点右上角「···」→「在浏览器中打开」。

**2. 安装时提示「禁止安装未知来源应用」？**
首次安装需开启「允许安装未知应用」：设置 → 安全 → 允许未知来源（各品牌路径不同）。下载页有图文步骤。

**3. 用户卸载后数据丢失？**
单机应用数据只在本机，卸载即清空。下载页已建议用户定期使用 App 内「备份导出」。

**4. iOS 用户怎么办？**
本分发方案仅面向 Android。iOS 必须经 App Store 或 TestFlight 分发，需要 Apple 开发者账号（¥688/年）与企业签名，属另一套流程，本期不做。

**5. 端口被占用？**
`PORT=9000 node server.js` 换端口。

**6. 版本清单改坏了 / 想要重置？**
`data/versions.json` 是纯文本，可直接编辑；也可以删除后让服务以空清单启动。
