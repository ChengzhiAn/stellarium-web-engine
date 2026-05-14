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

`npm install` 后会执行 **`postinstall`**：`scripts/patch-capacitor-android.js`（见下文「星空数据」）。

## 包名与显示名

- **applicationId**：`com.lenghu.astronomy`（见 `capacitor.config.json` 与 `android/` 工程）
- **应用名**：冷湖天文

## 开发 vs 生产

- **浏览器开发**：`npm run dev`；`/api` 代理仅在 dev server 下生效（见 `vue.config.js`）。
- **生产 / App**：静态资源在 `https://localhost`（Capacitor WebView）下加载；NoctuaSky 等需使用 **完整 HTTPS URL**（见 `.env.production`），否则会遇到跨域。`src/assets/sw_helpers.js` 里对 **绝对 `http(s)` URL** 在原生端使用 **`CapacitorHttp.get`**，避免 WebView 的 CORS 限制。

## 环境变量（`.env.production` / `.env.development`）

| 变量 | 说明 |
|------|------|
| `VUE_APP_NOCTUASKY_API_SERVER` | 生产建议设为 `https://api.noctuasky.com`（或你自建的 API 根 URL，**不要**末尾斜杠后的多余路径）。开发可留空走同源 `/api` 代理。 |
| `VUE_APP_DISABLE_WIKIPEDIA` | 设为 `1` 或 `true` 时，选中天体**不再请求**英文 Wikipedia 摘要（国内网络常超时）。生产默认已开启时可写进 `.env.production`。 |
| `VUE_APP_AMAP_WEB_SERVICE_KEY` | 可选；中国大陆地图 / 逆地理 / IP 定位等（见 `sw_helpers.js`）。 |

敏感 key 可放在 **`.env.production.local`** / **`.env.development.local`**（勿提交仓库）。

## 网络与体验

- **首次选中天体稍慢**：第一次访问 NoctuaSky 会经历 DNS、TCP、TLS；引擎就绪后会自动发一次轻量 **`querySkySources('Sun', 1)`** 做连接预热。选中恒星时若引擎已有 **`jsonData`**，会先展示本地信息，待 API 返回后再用在线数据覆盖（详见 `selected-object-info.vue` 与 `sw_helpers.js`）。
- **Wikipedia**：由 `VUE_APP_DISABLE_WIKIPEDIA` 控制；关闭后仅少一段摘要，不影响星表与 NoctuaSky 名称。

## 星空数据（星点很少 / 控制台 `Source is not a star survey`）

引擎从 **`dist/skydata/...`** 加载 HIP 星表等数据；打包时由 `vue.config.js` 从 **`apps/skydata`** 复制（若不存在则尝试 **`apps/test-skydata`**）。

### `properties` 被当成 SPA 路由（HTML5 mode）

Capacitor Android 在 **HTML5 mode** 下会把**无扩展名**路径当成前端路由，返回 **`index.html`**，导致 **`/skydata/stars/properties`** 不是纯文本星表头，引擎报 **`Source is not a star survey`**。

**处理**：`npm install` 时运行 **`scripts/patch-capacitor-android.js`**，给 `@capacitor/android` 的 `WebViewLocalServer.java` 打补丁：对以 **`/skydata/`** 开头且以 **`/properties`** 结尾的路径按静态文件返回。升级 `@capacitor/android` 后若补丁未命中，脚本会告警，需对照官方源码调整 needle。

### 其它排查

- 若控制台出现 **`Source is not a star survey: skydata/stars`**，先确认构建产物里存在 **`dist/skydata/stars/properties`**（二进制/文本头正确），再 **`npx cap sync android`** 后重装 App。
- **`tle_satellite.jsonl.gz` 404**：仅影响人造卫星 TLE 数据，与背景恒星是否显示无直接关系。
- **`sky culture western` 的 unknown section**：多为文化包元数据解析告警，一般**不导致**整片恒星消失；恒星仍以星表为准。
