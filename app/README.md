# 学时记 · App

React 19 + Vite 8 + Capacitor 8（Android）。

## 开发

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 纯函数测试（13 项）
npm run lint         # oxlint
```

## 构建

```bash
# Web 在线版：base=/public/web/，产物 dist/，可交给 backend 托管
npm run build

# 原生 App：base=/，产物 dist-capacitor/，给 Capacitor 打包
npm run build:capacitor
```

> 两个 base 不能混用。**打 APK 前必须跑 `build:capacitor`**，否则 APK 里还是旧页面。

## 打包 APK

需要 JDK 21 与 Android SDK 36：

```bash
npx cap sync android
cd android
./gradlew assembleRelease
# app/android/app/build/outputs/apk/release/app-release.apk
```

签名文件 `android/app/yanshiji-release.keystore` 与 `android/keystore.properties` 已 gitignore，请自行保管。

## 目录

```
src/
├── brand.js            # 品牌与备份标识（改名只改这里）
├── App.jsx             # 状态中枢与弹窗
├── pages/              # 首页 / 计时 / 统计 / 日志
├── components/         # 卡片、图表、弹窗、导航
├── services/           # storage / timerService / autoBackup / backupFile
└── styles/tokens.css   # 设计令牌
```

## 兼容性铁律

不要修改：`applicationId`、签名、`androidScheme`、localStorage 的 key 与字段名。`versionCode` 必须递增。否则覆盖安装会丢数据。

## 文档

- [开发文档](../docs/开发文档.md)
- [路线图](../docs/ROADMAP.md)
- [更新日志](../CHANGELOG.md)
