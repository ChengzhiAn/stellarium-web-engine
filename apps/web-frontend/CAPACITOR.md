# 冷湖天文 — Android（Capacitor）

宿主目录：`apps/web-frontend`（`webDir` = `dist`）。

## 前置条件

- Node 18+（本仓库根目录 `.node-version`）
- [Android Studio](https://developer.android.com/studio)（含 Android SDK、**JDK 17**）
- 本机已配置 `JAVA_HOME`（Gradle 需要；若命令行 `gradlew` 报未设置 Java，在 Android Studio 里打开工程构建即可）

## 常用命令

```bash
cd apps/web-frontend
npm install --legacy-peer-deps
npm run build:cap          # CAPACITOR_BUILD=1，资源用相对路径 ./，供 WebView 加载
npx cap sync android       # 将 dist 同步到 android/app/src/main/assets/public
```

在 Android Studio 中打开 **`apps/web-frontend/android`**，运行 **Run** 或使用 Gradle **assembleDebug** 生成 APK。

快捷脚本（等价于 build + sync）：

```bash
npm run android:build
```

## 包名与显示名

- **applicationId**：`com.lenghu.astronomy`（见 `capacitor.config.json` 与 `android/` 工程）
- **应用名**：冷湖天文

## 说明

- 开发浏览器仍用 `npm run dev`；`/api` 代理仅在 dev server 下生效。
- 生产 / App 内搜索等请求走 `.env.production` 中的 `VUE_APP_NOCTUASKY_API_SERVER`；若遇 CORS，需自建后端或改官方 API 白名单。

## 星空数据（星点很少 / 控制台 `Source is not a star survey`）

引擎从 **`dist/skydata/...`** 加载 HIP 星表等数据；打包时由 `vue.config.js` 从 **`apps/skydata`** 复制（若不存在则尝试 **`apps/test-skydata`**）。

- 若控制台出现 **`Source is not a star survey: skydata/stars`**，说明 **`skydata/stars/properties` 未正确加载**（常见原因：`npm run build:cap` 时本机没有完整 `skydata`，或 `cap sync` 后手机里仍是旧 `public`）。请确认构建产物里存在 `dist/skydata/stars/properties`，再执行 `npx cap sync android` 后重装 App。
- **`tle_satellite.jsonl.gz` 404**：仅影响人造卫星 TLE 数据，与背景恒星是否显示无直接关系。
- **`sky culture western` 的 unknown section**：多为文化包元数据解析告警，一般**不导致**整片恒星消失；恒星仍以星表为准。
